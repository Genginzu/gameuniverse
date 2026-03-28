/**
 * IGDB Webhook Service
 * Handles processing of incoming IGDB webhook events:
 * - create: auto-import new games, log characters
 * - update: log for manual review
 * - delete: log only
 */

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { GameImportService } from "@/lib/services/gameImportService";
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
 */
export async function processWebhookEvent(
  entityType: string,
  eventType: WebhookEventType,
  payload: WebhookPayload
): Promise<ProcessResult> {
  const supabase = getSupabaseAdmin();
  const igdbId = payload.id;

  // Resolve local entity references
  const { gameId, characterId } = await resolveLocalEntity(entityType, igdbId);

  // Insert the event record
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
      return await handleGameCreate(eventId, igdbId);
    }

    // update and delete events: just log them
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
