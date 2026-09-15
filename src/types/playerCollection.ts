import type { CollectionSummary } from "@/types/collection";
import type { GenreDistributionEntry, PlatformDistributionEntry } from "@/types/dashboard-stats";

/**
 * Advanced statistics for a collection (or an aggregate of collections).
 * Powers the genre pie chart, platform bar chart and extra metric cards
 * (average rating, completion rate, total playtime).
 */
export interface CollectionAdvancedStats {
  /** Number of games taken into account for the stats. */
  totalGames: number;
  /** Genre distribution of the games (top genres + "Autres" bucket). */
  genreDistribution: GenreDistributionEntry[];
  /** Platform distribution of the games. */
  platformDistribution: PlatformDistributionEntry[];
  /** Average game rating (metascore, 0-100), rounded to 1 decimal. Null if no rated game. */
  averageRating: number | null;
  /** Number of games the owner has marked as completed in their library. */
  completedGames: number;
  /** Completion rate: completedGames / totalGames as a percentage (0-100), integer. */
  completionRate: number;
  /** Sum of the owner's playtime (hours) for the games, rounded to 1 decimal. */
  totalPlaytimeHours: number;
}

/** Options de tri des collections */
export type CollectionSortOption =
  | "updated_at_desc"
  | "name_asc"
  | "name_desc"
  | "games_count_desc";

/** Statistiques agrégées des collections d'un joueur */
export interface PlayerCollectionsStatsData {
  totalCollections: number;
  totalGames: number;
  largestCollection: string | null; // nom de la collection la plus grande
}

/** Réponse de l'API des collections joueur (mode paginé) */
export interface PlayerCollectionsResponse {
  collections: CollectionSummary[];
  stats: PlayerCollectionsStatsData;
  /** Advanced aggregated stats (charts + extra cards). Present on page 1 only. */
  advancedStats?: CollectionAdvancedStats | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCollections: number;
    hasNextPage: boolean;
  };
}

/** Paramètres de requête pour l'API */
export interface PlayerCollectionsQueryParams {
  page?: number;
  sort?: CollectionSortOption;
  locale?: string;
}
