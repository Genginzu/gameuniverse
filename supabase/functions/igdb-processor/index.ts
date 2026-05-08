/**
 * IGDB Webhook Processor — Supabase Edge Function.
 *
 * Endpoint:
 *   POST /functions/v1/igdb-processor
 *
 * Body:
 *   { "eventId": "...", "force"?: boolean, "forceFields"?: string[] }
 *
 * Triggers:
 *   1. Database Webhook on igdb_webhook_events INSERT/UPDATE where
 *      status='received' (automatic, sends only `eventId`)
 *   2. Admin "apply manually" route on Vercel (sends eventId + force + forceFields)
 *
 * The processor is a thin router: it loads the event, resolves the local
 * entity, and delegates to a handler under handlers/. Each handler is
 * self-contained — extracting any of them into its own Edge Function
 * later only requires changing the dispatch line below.
 */

import { logger } from "../_shared/logger.ts";
import { getSupabaseAdmin } from "../_shared/supabase-admin.ts";
import { untypedTable } from "../_shared/untyped-table.ts";
import type { WebhookEventType } from "../_shared/igdb-types.ts";
import { resolveLocalEntity } from "./lib/resolve-entity.ts";
import { updateEventStatus } from "./lib/event-status.ts";
import { handleGameCreate } from "./handlers/games-create.ts";
import { handleGameUpdate } from "./handlers/games-update.ts";
import { handleGameDelete } from "./handlers/games-delete.ts";
import { handleCharacters } from "./handlers/characters.ts";
import { handlePopularity } from "./handlers/popularity.ts";

interface ProcessorRequest {
  eventId?: string;
  force?: boolean;
  forceFields?: string[];
}

interface WebhookEventRow {
  id: string;
  event_type: WebhookEventType;
  entity_type: string;
  igdb_id: number;
  game_id: string | null;
  character_id: string | null;
  payload: Record<string, unknown>;
  status: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let body: ProcessorRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  // Database Webhooks send the full row in `record`. We support both
  // shapes: { eventId } from the admin route and { record: { id, ... } }
  // from Postgres triggers.
  const eventId = body.eventId ??
    (body as unknown as { record?: { id?: string } }).record?.id;

  if (!eventId) {
    return jsonResponse({ error: "Missing eventId" }, 400);
  }

  const force = body.force ?? false;
  const forceFields = body.forceFields ?? [];

  try {
    const supabase = getSupabaseAdmin();
    const { data: event, error } = await untypedTable(supabase, "igdb_webhook_events")
      .select("id, event_type, entity_type, igdb_id, game_id, character_id, payload, status")
      .eq("id", eventId)
      .single();

    if (error || !event) {
      logger.warn("Processor: event not found", { eventId, error });
      return jsonResponse({ error: "Event not found" }, 404);
    }

    const row = event as WebhookEventRow;

    // popularity_primitives stores its game ref in payload.game_id.
    // payload.id identifies the primitive row itself.
    const popularityGameIgdbId =
      row.entity_type === "popularity_primitives" &&
      typeof row.payload?.game_id === "number"
        ? (row.payload.game_id as number)
        : null;

    // Always re-resolve in case the local entity was created/deleted
    // since the event was received.
    const resolved = await resolveLocalEntity(
      row.entity_type,
      row.igdb_id,
      popularityGameIgdbId,
    );

    const dispatchKey = `${row.entity_type}:${row.event_type}`;

    switch (dispatchKey) {
      case "games:create": {
        // If the game already exists locally, treat it as an update so
        // we keep manual edits via the diff applier.
        if (resolved.gameId) {
          const result = await handleGameUpdate({
            eventId: row.id,
            gameId: resolved.gameId,
            igdbId: row.igdb_id,
            payload: row.payload,
            force,
            forceFields,
          });
          return jsonResponse(result);
        }
        const result = await handleGameCreate({
          eventId: row.id,
          igdbId: row.igdb_id,
        });
        return jsonResponse(result);
      }

      case "games:update": {
        const result = await handleGameUpdate({
          eventId: row.id,
          gameId: resolved.gameId,
          igdbId: row.igdb_id,
          payload: row.payload,
          force,
          forceFields,
        });
        return jsonResponse(result);
      }

      case "games:delete": {
        if (!resolved.gameId) {
          // Nothing to delete — log and mark as processed
          await updateEventStatus(row.id, "processed");
          return jsonResponse({ success: true, info: "no local game to delete" });
        }
        const result = await handleGameDelete({
          eventId: row.id,
          gameId: resolved.gameId,
        });
        return jsonResponse(result);
      }

      case "popularity_primitives:create":
      case "popularity_primitives:update":
      case "popularity_primitives:delete": {
        const result = await handlePopularity({
          eventId: row.id,
          gameId: resolved.gameId,
          popularityGameIgdbId,
        });
        return jsonResponse(result);
      }

      case "characters:create":
      case "characters:update":
      case "characters:delete": {
        await handleCharacters({
          eventId: row.id,
          eventType: row.event_type,
          igdbId: row.igdb_id,
        });
        return jsonResponse({ success: true });
      }

      default: {
        logger.warn("Processor: unknown dispatch key, marking processed", {
          eventId,
          dispatchKey,
        });
        await updateEventStatus(row.id, "processed");
        return jsonResponse({ success: true, info: "unknown event type" });
      }
    }
  } catch (error) {
    logger.error("Processor error", { eventId, error });
    const message = error instanceof Error ? error.message : "Unknown error";
    try {
      await updateEventStatus(eventId, "failed", message);
    } catch {
      // best-effort
    }
    return jsonResponse({ error: message }, 500);
  }
});
