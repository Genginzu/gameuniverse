import type { CollectionAdvancedStats } from "@/types/playerCollection";
import { computeGenreDistribution, computePlatformDistribution } from "./dashboardStatsCompute";

/**
 * Per-game data required to compute a collection's advanced stats.
 * Genres and platforms are already resolved to localized names.
 */
export interface CollectionGameData {
  metascore: number | null;
  genres: string[];
  platforms: string[];
}

/**
 * Owner library entry for a game contained in the collection.
 * Used to derive completion rate and total playtime.
 */
export interface OwnerLibraryEntry {
  status: string | null;
  playTimeHours: number;
}

/**
 * Compute the average game rating (metascore, 0-100) across games.
 * Ignores games without a rating. Returns null when none is rated.
 * Rounded to 1 decimal.
 */
export function computeAverageRating(ratings: Array<number | null>): number | null {
  const valid = ratings.filter((r): r is number => typeof r === "number" && !isNaN(r));
  if (valid.length === 0) return null;
  const avg = valid.reduce((sum, r) => sum + r, 0) / valid.length;
  return Math.round(avg * 10) / 10;
}

/**
 * Compute completion metrics from the owner's library entries for the
 * collection's games. `totalGames` is the collection size (denominator).
 * completionRate is an integer percentage (0-100).
 */
export function computeCollectionCompletion(
  library: OwnerLibraryEntry[],
  totalGames: number
): { completedGames: number; completionRate: number } {
  const completedGames = library.filter((e) => e.status === "completed").length;
  const completionRate = totalGames > 0 ? Math.round((completedGames / totalGames) * 100) : 0;
  return { completedGames, completionRate };
}

/**
 * Sum the owner's playtime (hours) across library entries.
 * Rounded to 1 decimal.
 */
export function computeCollectionPlaytime(library: OwnerLibraryEntry[]): number {
  const total = library.reduce((sum, e) => sum + (e.playTimeHours || 0), 0);
  return Math.round(total * 10) / 10;
}

/**
 * Assemble the full advanced stats object for a collection.
 * Pure function — no DB access — fully unit-testable.
 */
export function computeCollectionAdvancedStats(
  games: CollectionGameData[],
  library: OwnerLibraryEntry[]
): CollectionAdvancedStats {
  const { completedGames, completionRate } = computeCollectionCompletion(library, games.length);

  return {
    totalGames: games.length,
    genreDistribution: computeGenreDistribution(games.map((g) => ({ genres: g.genres }))),
    platformDistribution: computePlatformDistribution(
      games.map((g) => ({ platforms: g.platforms }))
    ),
    averageRating: computeAverageRating(games.map((g) => g.metascore)),
    completedGames,
    completionRate,
    totalPlaytimeHours: computeCollectionPlaytime(library),
  };
}

/** Empty stats used when a collection has no games. */
export function emptyCollectionAdvancedStats(): CollectionAdvancedStats {
  return {
    totalGames: 0,
    genreDistribution: [],
    platformDistribution: [],
    averageRating: null,
    completedGames: 0,
    completionRate: 0,
    totalPlaytimeHours: 0,
  };
}
