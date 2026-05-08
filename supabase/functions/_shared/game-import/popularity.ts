/**
 * IGDB popularity primitives sync.
 * Deno port of src/lib/services/game-import/popularity.ts.
 */

import { getSupabaseAdmin } from "../supabase-admin.ts";
import { IGDBService } from "../igdb-service.ts";
import { logger } from "../logger.ts";

export async function fetchAndSavePopularity(
  gameId: string,
  igdbId: number,
): Promise<void> {
  try {
    const primitives = await IGDBService.getPopularityPrimitives(igdbId);
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("games")
      .update({
        igdb_pop_visits: primitives?.visits ?? null,
        igdb_pop_want_to_play: primitives?.wantToPlay ?? null,
        igdb_pop_playing: primitives?.playing ?? null,
        igdb_pop_updated_at: new Date().toISOString(),
      })
      .eq("id", gameId);

    if (error) {
      logger.error("Failed to save popularity primitives", { gameId, igdbId, error });
    }
  } catch (error) {
    logger.error("Error fetching popularity primitives from IGDB", { igdbId, error });
  }
}
