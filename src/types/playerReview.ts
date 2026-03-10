// Types pour l'onglet avis du profil joueur
// Affiche les reviews de jeux rédigées par un joueur avec statistiques agrégées

/** Options de tri des avis */
export type ReviewSortOption = "date_desc" | "date_asc" | "rating_desc" | "rating_asc";

/** Avis d'un joueur tel qu'affiché dans l'onglet */
export interface PlayerReviewItem {
  id: string;
  gameId: string;
  gameSlug: string;
  gameName: string;
  gameCoverUrl: string | null;
  rating: number;
  content: string;
  positivePoints: string[];
  negativePoints: string[];
  createdAt: string;
  updatedAt: string;
}

/** Distribution des notes par tranche */
export interface RatingDistribution {
  range: string; // "0-5", "6-10", "11-15", "16-20"
  count: number;
  percentage: number; // 0-100
}

/** Statistiques agrégées des avis d'un joueur */
export interface PlayerReviewsStatsData {
  totalCount: number;
  averageRating: number | null;
  distribution: RatingDistribution[];
}

/** Réponse de l'API des avis joueur */
export interface PlayerReviewsResponse {
  reviews: PlayerReviewItem[];
  stats: PlayerReviewsStatsData;
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

/** Paramètres de requête pour l'API */
export interface PlayerReviewsQueryParams {
  page?: number;
  sort?: ReviewSortOption;
  locale?: string;
}
