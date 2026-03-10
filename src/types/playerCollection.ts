import type { CollectionSummary } from "@/types/collection";

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
