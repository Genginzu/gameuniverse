// Types pour les statistiques enrichies des joueurs
// Requirements: 1.1, 2.1, 2.4, 3.1, 3.3, 5.1, 5.2, 5.5

/**
 * Statistiques enrichies d'un joueur
 * Calculées à partir de user_library, game_reviews et game_genres
 */
export interface EnrichedStats {
  totalPlayTime: number;
  favoriteGenre: FavoriteGenre | null;
  reviewCount: number;
  averageReviewRating: number | null;
}

/**
 * Genre favori avec temps de jeu associé
 * Pondéré par le nombre de genres par jeu
 */
export interface FavoriteGenre {
  name: string;
  playTime: number;
}

/**
 * Jeu le plus joué (pour le résumé annuel)
 * Inclut les informations d'affichage du jeu
 */
export interface TopGame {
  id: string;
  title: string;
  coverImage: string | null;
  playTime: number;
}

/**
 * Mois le plus actif d'une année
 * Basé sur le nombre de jeux ajoutés par mois
 */
export interface MostActiveMonth {
  month: number;
  gamesAdded: number;
}

/**
 * Résumé annuel complet d'un joueur
 * Contient toutes les statistiques pour une année donnée
 */
export interface YearInReview {
  year: number;
  totalPlayTime: number;
  gamesAdded: number;
  favoriteGenre: FavoriteGenre | null;
  topGame: TopGame | null;
  reviewCount: number;
  mostActiveMonth: MostActiveMonth | null;
  availableYears: number[];
}

/** Réponse API pour les stats enrichies */
export interface EnrichedStatsResponse {
  stats: EnrichedStats;
}

/** Réponse API pour le résumé annuel */
export interface YearInReviewResponse {
  yearReview: YearInReview;
}
