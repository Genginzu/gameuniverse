/**
 * Handler for `games create` webhook events.
 *
 * Auto-imports the new game from IGDB. If the game already exists locally
 * (race with a manual import), GameImportService.syncWithIGDB takes over
 * to refresh the data.
 */

import { GameImportService } from "../../_shared/game-import-service.ts";
import { logger } from "../../_shared/logger.ts";
import { linkEventToGameId, updateEventStatus } from "../lib/event-status.ts";

export interface HandleGameCreateInput {
  eventId: string;
  igdbId: number;
}

export async function handleGameCreate(
  input: HandleGameCreateInput,
): Promise<{ success: boolean; error?: string; gameId?: string; slug?: string }> {
  const { eventId, igdbId } = input;

  await updateEventStatus(eventId, "processing");

  const result = await GameImportService.importFromIGDB(igdbId);

  if (!result.success) {
    await updateEventStatus(eventId, "failed", result.error);
    return { success: false, error: result.error };
  }

  if (result.gameId) {
    await linkEventToGameId(eventId, result.gameId);
  }

  await updateEventStatus(eventId, "processed");
  logger.info("Webhook: game auto-imported", {
    eventId,
    igdbId,
    slug: result.slug,
  });

  return {
    success: true,
    gameId: result.gameId,
    slug: result.slug,
  };
}
