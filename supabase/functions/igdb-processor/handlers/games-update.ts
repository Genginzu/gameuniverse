/**
 * Handler for `games update` webhook events.
 *
 * Applies non-overridden fields from the IGDB payload to the local game.
 * If admin overrides conflict with the payload, the event stays as
 * `received` so an admin can review and resolve via the diff page.
 *
 * The same handler is reused by the admin "apply manually" route via
 * the `force` flag: callers can pass force=true to bypass the conflict
 * gate, and forceFields to selectively overwrite admin-overridden fields.
 */

import { getSupabaseAdmin } from "../../_shared/supabase-admin.ts";
import { logger } from "../../_shared/logger.ts";
import { applyWebhookPayload } from "../../_shared/webhook-diff-applier.ts";
import { GameImportService } from "../../_shared/game-import-service.ts";
import { linkEventToGameId, updateEventStatus } from "../lib/event-status.ts";

export interface HandleGameUpdateInput {
  eventId: string;
  gameId: string | null;
  igdbId: number;
  payload: Record<string, unknown>;
  /** Skip the conflict gate; mark as processed even if there are skipped fields */
  force?: boolean;
  /** Field names to force-apply even if an admin override exists */
  forceFields?: string[];
}

export async function handleGameUpdate(
  input: HandleGameUpdateInput,
): Promise<{
  success: boolean;
  error?: string;
  appliedFields?: string[];
  skippedFields?: string[];
}> {
  const { eventId, igdbId, payload, force = false, forceFields = [] } = input;
  let { gameId } = input;

  // No local game yet: auto-import (same behaviour as the previous Vercel
  // implementation). This protects against a race where an `update` arrives
  // for a game we haven't imported yet.
  if (!gameId) {
    await updateEventStatus(eventId, "processing");
    const importResult = await GameImportService.importFromIGDB(igdbId);
    if (!importResult.success || !importResult.gameId) {
      await updateEventStatus(eventId, "failed", importResult.error);
      return { success: false, error: importResult.error };
    }
    gameId = importResult.gameId;
    await linkEventToGameId(eventId, gameId);
    await updateEventStatus(eventId, "processed");
    return {
      success: true,
      appliedFields: ["auto-imported"],
      skippedFields: [],
    };
  }

  await updateEventStatus(eventId, "processing");

  const supabase = getSupabaseAdmin();
  const result = await applyWebhookPayload(supabase, {
    gameId,
    payload,
    forceFields: new Set(forceFields),
  });

  if (result.error) {
    await updateEventStatus(eventId, "failed", result.error);
    return { success: false, error: result.error };
  }

  // When called from the receiver pipeline (force=false): leave conflicts
  // as `received` for admin review.
  if (!force && result.skippedFields.length > 0) {
    await updateEventStatus(eventId, "received");
    logger.info("Webhook: game update partially applied, conflicts pending", {
      eventId,
      gameId,
      applied: result.appliedFields,
      conflicts: result.skippedFields,
    });
    return {
      success: true,
      appliedFields: result.appliedFields,
      skippedFields: result.skippedFields,
    };
  }

  await updateEventStatus(eventId, "processed");
  logger.info("Webhook: game update applied", {
    eventId,
    gameId,
    applied: result.appliedFields,
    skipped: result.skippedFields,
    force,
  });

  return {
    success: true,
    appliedFields: result.appliedFields,
    skippedFields: result.skippedFields,
  };
}
