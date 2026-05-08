/**
 * Webhook event lifecycle helpers for the processor.
 *
 * Each handler updates the event status as it progresses:
 *   received → processing → processed (success)
 *                          → failed   (error)
 *                          → received (left for manual review on conflicts)
 */

import { getSupabaseAdmin } from "../../_shared/supabase-admin.ts";
import { untypedTable } from "../../_shared/untyped-table.ts";
import type { WebhookEventStatus } from "../../_shared/igdb-types.ts";

export async function updateEventStatus(
  eventId: string,
  status: WebhookEventStatus,
  errorMessage?: string,
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

export async function linkEventToGameId(eventId: string, gameId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await untypedTable(supabase, "igdb_webhook_events")
    .update({ game_id: gameId })
    .eq("id", eventId);
}
