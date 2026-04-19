/**
 * IGDB Webhook Service
 * Handles processing of incoming IGDB webhook events:
 * - create: auto-import new games, log characters
 * - update: auto-apply diff if game exists locally, auto-import if not
 * - delete: log only
 * - popularity_primitives: refresh igdb_pop_* columns on the matching game
 */

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { GameImportService } from "@/lib/services/gameImportService";
import { applyWebhookPayload } from "@/lib/services/webhookDiffApplier";
import { fetchAndSavePopularity } from "@/lib/services/game-import/popularity";
import { notifyGameDeleted, invalidateGameCache } from "@/lib/realtime-updates";
import { invalidateForDeletedGame } from "@/lib/services/recommendation/cache";
import { logger } from "@/lib/logger";
import type { WebhookEventType, WebhookEventStatus } from "@/types/webhooks";
import { untypedTable } from "@/lib/utils/untypedTable";

interface WebhookPayload {
  id: number;
  [key: string]: unknown;
}

interface ProcessResult {
  eventId: string;
  status: WebhookEventStatus;
  error?: string;
}

/**
 * Log a webhook event to the database and process it.
 * For games: ensures the game exists locally BEFORE logging the event,
 * so the event always has a valid game_id and name.
 */
export async function processWebhookEvent(
  entityType: string,
  eventType: WebhookEventType,
  payload: WebhookPayload
): Promise<ProcessResult> {
  const supabase = getSupabaseAdmin();
  const igdbId = payload.id;

  // popularity_primitives payloads reference the game via payload.game_id,
  // not payload.id (which identifies the primitive row itself).
  const popularityGameIgdbId =
    entityType === "popularity_primitives" && typeof payload.game_id === "number"
      ? (payload.game_id as number)
      : null;

  // Resolve local entity — for games, auto-import if missing
  const resolved = await resolveLocalEntity(entityType, igdbId, popularityGameIgdbId);
  let gameId = resolved.gameId;
  const preExistingGameId = resolved.gameId;
  const characterId = resolved.characterId;

  // Auto-import is reserved for events that need a local row to act on (create,
  // update). Delete events don't need the game (we'd just delete it) and
  // re-importing an existing game for a create/update is handled via the diff
  // applier below instead of a full re-import (less risky and override-aware).
  if (entityType === "games" && !gameId && eventType !== "delete") {
    try {
      const importResult = await GameImportService.importFromIGDB(igdbId);
      if (importResult.success && importResult.game) {
        gameId = importResult.game.id;
        logger.info("Webhook: auto-imported game before logging event", {
          igdbId,
          gameId,
        });
      }
    } catch (error) {
      logger.warn("Webhook: failed to auto-import game, event will have no game_id", {
        igdbId,
        error,
      });
    }
  }

  // Insert the event record (now with game_id resolved)
  const { data: event, error: insertError } = await untypedTable(supabase, "igdb_webhook_events")
    .insert({
      event_type: eventType,
      entity_type: entityType,
      igdb_id: igdbId,
      game_id: gameId,
      character_id: characterId,
      payload,
      status: "received",
    })
    .select("id")
    .single();

  if (insertError || !event) {
    logger.error("Failed to insert webhook event", { error: insertError, entityType, igdbId });
    return { eventId: "", status: "failed", error: insertError?.message ?? "Insert failed" };
  }

  const eventId = event.id as string;

  // Process based on event type
  try {
    if (eventType === "create" && entityType === "games") {
      // Game was pre-existing — apply payload to refresh non-admin-overridden
      // fields. This keeps local data in sync with IGDB without clobbering
      // manual edits (which would happen if we ran the full import pipeline).
      if (preExistingGameId) {
        return await handleGameUpdate(eventId, preExistingGameId, payload);
      }
      // Game was just auto-imported above — nothing more to do.
      if (gameId) {
        await updateEventStatus(eventId, "processed");
        return { eventId, status: "processed" };
      }
      // Import failed earlier, try again
      return await handleGameCreate(eventId, igdbId);
    }

    if (eventType === "update" && entityType === "games" && gameId) {
      return await handleGameUpdate(eventId, gameId, payload);
    }

    if (eventType === "update" && entityType === "games" && !gameId) {
      return await handleGameCreate(eventId, igdbId);
    }

    if (entityType === "popularity_primitives") {
      return await handlePopularityPrimitive(eventId, gameId, popularityGameIgdbId);
    }

    if (eventType === "delete" && entityType === "games" && gameId) {
      return await handleGameDelete(eventId, gameId);
    }

    // Non-actionable events (delete of unknown game, character events, etc.) — log only
    await updateEventStatus(eventId, "processed");
    return { eventId, status: "processed" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown processing error";
    await updateEventStatus(eventId, "failed", message);
    return { eventId, status: "failed", error: message };
  }
}

/**
 * Handle a new game creation from IGDB — auto-import it.
 */
async function handleGameCreate(eventId: string, igdbId: number): Promise<ProcessResult> {
  await updateEventStatus(eventId, "processing");

  const result = await GameImportService.importFromIGDB(igdbId);

  if (!result.success) {
    await updateEventStatus(eventId, "failed", result.error);
    return { eventId, status: "failed", error: result.error };
  }

  // Link the event to the newly created game
  if (result.game?.slug) {
    await linkEventToGame(eventId, result.game.slug);
  }

  await updateEventStatus(eventId, "processed");
  logger.info("Webhook: game auto-imported", { igdbId, slug: result.game?.slug });
  return { eventId, status: "processed" };
}

/**
 * Handle a game update from IGDB — auto-apply non-overridden fields.
 * If conflicts exist (admin-overridden fields differ), the event stays
 * as "received" so admins can review via the diff page.
 */
async function handleGameUpdate(
  eventId: string,
  gameId: string,
  payload: WebhookPayload
): Promise<ProcessResult> {
  await updateEventStatus(eventId, "processing");

  const supabase = getSupabaseAdmin();
  const result = await applyWebhookPayload(supabase, {
    gameId,
    payload: payload as Record<string, unknown>,
  });

  if (result.error) {
    await updateEventStatus(eventId, "failed", result.error);
    return { eventId, status: "failed", error: result.error };
  }

  // If there are skipped fields (conflicts), mark as "received" for manual review
  if (result.skippedFields.length > 0) {
    await updateEventStatus(eventId, "received");
    logger.info("Webhook: game update partially applied, conflicts pending", {
      eventId,
      gameId,
      applied: result.appliedFields,
      conflicts: result.skippedFields,
    });
    return { eventId, status: "received" };
  }

  await updateEventStatus(eventId, "processed");
  logger.info("Webhook: game update fully applied", {
    eventId,
    gameId,
    applied: result.appliedFields,
  });
  return { eventId, status: "processed" };
}

/**
 * Handle a game deletion from IGDB — cascade-delete the local game and related
 * rows (genres, companies, screenshots, translations, platforms, characters,
 * library entries, etc.). Related webhook events have `ON DELETE SET NULL` on
 * `game_id`, so they are preserved in the audit log.
 */
async function handleGameDelete(eventId: string, gameId: string): Promise<ProcessResult> {
  await updateEventStatus(eventId, "processing");

  const supabase = getSupabaseAdmin();

  // Fetch the slug before deletion for the realtime notification payload
  const { data: existingGame } = await supabase
    .from("games")
    .select("slug")
    .eq("id", gameId)
    .single();

  const { error: deleteError } = await supabase.from("games").delete().eq("id", gameId);

  if (deleteError) {
    await updateEventStatus(eventId, "failed", deleteError.message);
    return { eventId, status: "failed", error: deleteError.message };
  }

  const slug = (existingGame?.slug as string | undefined) ?? "";

  try {
    await notifyGameDeleted(gameId, slug);
    await invalidateGameCache(gameId);
    invalidateForDeletedGame(gameId);
  } catch (err) {
    logger.warn("Webhook: game deleted but post-cleanup failed", {
      gameId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  await updateEventStatus(eventId, "processed");
  logger.info("Webhook: game deleted from local DB", { eventId, gameId, slug });
  return { eventId, status: "processed" };
}

/**
 * Handle a popularity_primitives webhook — refresh the IGDB pop columns on
 * the matching local game. If the game isn't imported yet, skip rather than
 * auto-import: a popularity event alone doesn't justify creating a stub row
 * without cover/translations/etc.
 */
async function handlePopularityPrimitive(
  eventId: string,
  gameId: string | null,
  popularityGameIgdbId: number | null
): Promise<ProcessResult> {
  if (!gameId || !popularityGameIgdbId) {
    logger.info("Webhook: popularity_primitives for unknown game, skipping", {
      eventId,
      popularityGameIgdbId,
    });
    await updateEventStatus(eventId, "processed");
    return { eventId, status: "processed" };
  }

  await updateEventStatus(eventId, "processing");
  await fetchAndSavePopularity(gameId, popularityGameIgdbId);
  await updateEventStatus(eventId, "processed");
  return { eventId, status: "processed" };
}

/**
 * Resolve local game_id or character_id from an IGDB ID.
 * For popularity_primitives events, uses `popularityGameIgdbId` (from
 * payload.game_id) instead of the event's `igdbId` (the primitive row ID).
 */
async function resolveLocalEntity(
  entityType: string,
  igdbId: number,
  popularityGameIgdbId: number | null = null
): Promise<{ gameId: string | null; characterId: string | null }> {
  const supabase = getSupabaseAdmin();

  if (entityType === "games") {
    const { data } = await supabase.from("games").select("id").eq("igdb_id", igdbId).single();
    return { gameId: (data?.id as string) ?? null, characterId: null };
  }

  if (entityType === "characters") {
    const { data } = await supabase.from("characters").select("id").eq("igdb_id", igdbId).single();
    return { gameId: null, characterId: (data?.id as string) ?? null };
  }

  if (entityType === "popularity_primitives" && popularityGameIgdbId !== null) {
    const { data } = await supabase
      .from("games")
      .select("id")
      .eq("igdb_id", popularityGameIgdbId)
      .single();
    return { gameId: (data?.id as string) ?? null, characterId: null };
  }

  return { gameId: null, characterId: null };
}

/**
 * Link a webhook event to a game by slug (after import).
 */
async function linkEventToGame(eventId: string, gameSlug: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: game } = await supabase.from("games").select("id").eq("slug", gameSlug).single();

  if (game) {
    await untypedTable(supabase, "igdb_webhook_events")
      .update({ game_id: game.id })
      .eq("id", eventId);
  }
}

/**
 * Update the status of a webhook event.
 */
async function updateEventStatus(
  eventId: string,
  status: WebhookEventStatus,
  errorMessage?: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const update: Record<string, unknown> = { status };

  if (status === "processed" || status === "failed") {
    update.processed_at = new Date().toISOString();
  }
  if (errorMessage) {
    update.error_message = errorMessage;
  }

  await untypedTable(supabase, "igdb_webhook_events").update(update).eq("id", eventId);
}
