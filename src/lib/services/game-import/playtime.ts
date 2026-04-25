import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { IGDBService } from "../igdbService";
import { logger } from "@/lib/logger";
import { GameDetails } from "@/types/game";

/**
 * Fetches and saves playtime data from IGDB.
 */
export async function fetchAndSavePlaytime(gameId: string, igdbId: number): Promise<void> {
  try {
    const timeToBeat = await IGDBService.getTimeToBeat(igdbId);
    if (!timeToBeat) return;

    const secondsToHours = (seconds: number | null | undefined): number | null => {
      if (seconds === null || seconds === undefined || seconds === 0 || isNaN(seconds)) return null;
      return Math.round((seconds / 3600) * 10) / 10;
    };

    const hastily = secondsToHours(timeToBeat.hastily);
    const normally = secondsToHours(timeToBeat.normally);
    const completely = secondsToHours(timeToBeat.completely);

    if (hastily === null && normally === null && completely === null) return;

    const supabase = await getSupabaseAdmin();

    const { data, error } = await supabase
      .from("games")
      .update({
        playtime_hastily: hastily,
        playtime_normally: normally,
        playtime_completely: completely,
        playtime_updated_at: new Date().toISOString(),
      })
      .eq("id", gameId)
      .select("id, playtime_hastily, playtime_normally, playtime_completely");

    if (error) {
      logger.error("Failed to save playtime", { gameId, igdbId, error });
    } else if (!data || data.length === 0) {
      logger.error("No rows updated for playtime — possible RLS issue", { gameId });
    }
  } catch (error) {
    logger.error("Error fetching playtime from IGDB", { igdbId, error });
  }
}

/**
 * Fetches complete game details by slug via the API.
 */
export async function fetchGameDetails(slug: string): Promise<GameDetails | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/games/${slug}?locale=en`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    logger.error("Error fetching game details", { slug, error });
    return null;
  }
}
