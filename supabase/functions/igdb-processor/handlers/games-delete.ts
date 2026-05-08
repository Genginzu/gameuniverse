/**
 * Handler for `games delete` webhook events.
 *
 * Deletes the local game; cascade FK constraints clean up related rows
 * (genres, screenshots, library entries, etc.). The webhook event itself
 * is preserved for audit (game_id is set to null via ON DELETE SET NULL).
 */

import { getSupabaseAdmin } from "../../_shared/supabase-admin.ts";
import { logger } from "../../_shared/logger.ts";
import { updateEventStatus } from "../lib/event-status.ts";

export interface HandleGameDeleteInput {
  eventId: string;
  gameId: string;
}

export async function handleGameDelete(
  input: HandleGameDeleteInput,
): Promise<{ success: boolean; error?: string }> {
  const { eventId, gameId } = input;

  await updateEventStatus(eventId, "processing");

  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("games").delete().eq("id", gameId);

  if (error) {
    await updateEventStatus(eventId, "failed", error.message);
    return { success: false, error: error.message };
  }

  await updateEventStatus(eventId, "processed");
  logger.info("Webhook: game deleted", { eventId, gameId });
  return { success: true };
}
