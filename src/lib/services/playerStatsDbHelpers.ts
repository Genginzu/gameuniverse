import type { FavoriteGenre } from "@/types/player-stats";
import {
  computeFavoriteGenre,
  computeTotalPlayTime,
  computeReviewStats,
  type LibraryEntryWithGenres,
} from "./playerStatsService";
import { extractGenreEntries } from "./playerStatsYearHelpers";
import { logger } from "@/lib/logger";

/**
 * Vérifie si les stats d'un joueur sont privées.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function isStatsPrivate(supabase: any, playerId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("stats_private")
    .eq("id", playerId)
    .single();

  if (error) {
    logger.error("Error checking stats privacy", { error });
    return false;
  }

  return data?.stats_private === true;
}

/**
 * Récupère le temps de jeu total d'un joueur.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchTotalPlayTime(supabase: any, playerId: string): Promise<number> {
  const { data, error } = await supabase
    .from("user_library")
    .select("play_time_hours")
    .eq("user_id", playerId);

  if (error) {
    logger.error("Error fetching play time", { error });
    return 0;
  }

  if (!data || data.length === 0) return 0;

  const playTimes = (data as { play_time_hours: number }[]).map(
    (entry) => entry.play_time_hours ?? 0
  );

  return computeTotalPlayTime(playTimes);
}

/**
 * Récupère le genre favori via requête DB avec pondération multi-genre.
 */
export async function fetchFavoriteGenreFromDB(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  playerId: string,
  locale: string
): Promise<FavoriteGenre | null> {
  const { data: libraryData, error: libError } = await supabase
    .from("user_library")
    .select(
      `
      play_time_hours,
      game_id,
      games!inner(
        game_genres(
          genres!inner(
            genre_translations!inner(name, language_code)
          )
        )
      )
    `
    )
    .eq("user_id", playerId)
    .gt("play_time_hours", 0);

  if (libError) {
    logger.error("Error fetching library with genres", { error: libError });
    return null;
  }

  if (!libraryData || libraryData.length === 0) return null;

  const entries: LibraryEntryWithGenres[] = extractGenreEntries(libraryData, locale);
  return computeFavoriteGenre(entries);
}

/**
 * Récupère les stats de reviews d'un joueur.
 */
export async function fetchReviewStats(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  playerId: string
): Promise<{ reviewCount: number; averageRating: number | null }> {
  const { data, error } = await supabase
    .from("game_reviews")
    .select("rating")
    .eq("user_id", playerId);

  if (error) {
    logger.error("Error fetching review stats", { error });
    return { reviewCount: 0, averageRating: null };
  }

  if (!data || data.length === 0) {
    return { reviewCount: 0, averageRating: null };
  }

  const ratings = (data as { rating: number }[]).map((r) => r.rating);
  return computeReviewStats(ratings);
}
