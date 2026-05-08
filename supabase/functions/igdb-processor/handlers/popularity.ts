/**
 * Handler for `popularity_primitives` webhook events.
 *
 * Refreshes the IGDB pop columns on the matching local game.
 * If the game isn't imported yet, we skip rather than auto-importing —
 * popularity alone doesn't justify creating a stub row without
 * cover/translations/etc.
 */

import { logger } from "../../_shared/logger.ts";
import { fetchAndSavePopularity } from "../../_shared/game-import/popularity.ts";
import { updateEventStatus } from "../lib/event-status.ts";

export interface HandlePopularityInput {
  eventId: string;
  gameId: string | null;
  popularityGameIgdbId: number | null;
}

export async function handlePopularity(
  input: HandlePopularityInput,
): Promise<{ success: boolean }> {
  const { eventId, gameId, popularityGameIgdbId } = input;

  if (!gameId || !popularityGameIgdbId) {
    logger.info(
      "Webhook: popularity_primitives for unknown game, skipping",
      { eventId, popularityGameIgdbId },
    );
    await updateEventStatus(eventId, "processed");
    return { success: true };
  }

  await updateEventStatus(eventId, "processing");
  await fetchAndSavePopularity(gameId, popularityGameIgdbId);
  await updateEventStatus(eventId, "processed");
  return { success: true };
}
