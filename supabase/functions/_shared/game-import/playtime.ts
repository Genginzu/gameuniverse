/**
 * Playtime sync from IGDB time-to-beat data.
 * Deno port of src/lib/services/game-import/playtime.ts.
 *
 * Note: the Next.js version exposes `fetchGameDetails(slug)` which
 * calls back into the Next.js API. That helper is intentionally not
 * ported — Edge Functions don't need to round-trip through Vercel.
 */

import { getSupabaseAdmin } from "../supabase-admin.ts";
import { IGDBService } from "../igdb-service.ts";
import { logger } from "../logger.ts";

function secondsToHours(seconds: number | null | undefined): number | null {
  if (seconds === null || seconds === undefined || seconds === 0 || isNaN(seconds)) {
    return null;
  }
  return Math.round((seconds / 3600) * 10) / 10;
}

export async function fetchAndSavePlaytime(
  gameId: string,
  igdbId: number,
): Promise<void> {
  try {
    const timeToBeat = await IGDBService.getTimeToBeat(igdbId);
    if (!timeToBeat) return;

    const hastily = secondsToHours(timeToBeat.hastily);
    const normally = secondsToHours(timeToBeat.normally);
    const completely = secondsToHours(timeToBeat.completely);

    if (hastily === null && normally === null && completely === null) return;

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("games")
      .update({
        playtime_hastily: hastily,
        playtime_normally: normally,
        playtime_completely: completely,
        playtime_updated_at: new Date().toISOString(),
      })
      .eq("id", gameId);

    if (error) {
      logger.error("Failed to save playtime", { gameId, igdbId, error });
    }
  } catch (error) {
    logger.error("Error fetching playtime from IGDB", { igdbId, error });
  }
}
