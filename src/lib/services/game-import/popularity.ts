import { createRouteHandlerClient } from "@/lib/supabase-server";
import { IGDBService } from "../igdbService";
import { logger } from "@/lib/logger";

/**
 * Fetches IGDB popularity primitives and stores them on the game row.
 * Non-fatal: errors are logged; the calling import/sync continues.
 */
export async function fetchAndSavePopularity(gameId: string, igdbId: number): Promise<void> {
  try {
    const primitives = await IGDBService.getPopularityPrimitives(igdbId);
    const supabase = await createRouteHandlerClient();

    // Columns added by migration 20260420000001 but not yet in generated types.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("games") as any)
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
