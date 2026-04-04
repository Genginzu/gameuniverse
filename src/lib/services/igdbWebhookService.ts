/**
 * IGDB Webhook Service
 * Handles processing of incoming IGDB webhook events:
 * - create: auto-import new games, log characters
 * - update: auto-apply diff if game exists locally, auto-import if not
 * - delete: log only
 */

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { GameImportService } from "@/lib/services/gameImportService";
import { applyWebhookPayload } from "@/lib/services/webhookDiffApplier";
import { logger } from "@/lib/logger";
import type { WebhookEventType, WebhookEventStatus } from "@/types/webhooks";

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

  // Resolve local entity — for games, auto-import if missing
  let { gameId, characterId } = await resolveLocalEntity(entityType, igdbId);

  if (entityType === "games" && !gameId) {
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
  const { data: event, error: insertError } = await supabase
    .from("igdb_webhook_events")
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
      // Game was already imported above — just mark as processed
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

    // delete events and non-game entities: just log them
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
 * Resolve local game_id or character_id from an IGDB ID.
 */
async function resolveLocalEntity(
  entityType: string,
  igdbId: number
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

  return { gameId: null, characterId: null };
}

/**
 * Link a webhook event to a game by slug (after import).
 */
async function linkEventToGame(eventId: string, gameSlug: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: game } = await supabase.from("games").select("id").eq("slug", gameSlug).single();

  if (game) {
    await supabase.from("igdb_webhook_events").update({ game_id: game.id }).eq("id", eventId);
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

  await supabase.from("igdb_webhook_events").update(update).eq("id", eventId);
}
