// Types pour les pages joueurs
// Requirements: 1.2, 5.2, 6.4

/**
 * Résumé d'un joueur pour l'affichage dans la liste
 * Utilisé dans PlayerCard et la grille de joueurs
 */
export interface PlayerSummary {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  gamesCount: number;
  createdAt: string;
}

/**
 * Statistiques de la bibliothèque d'un joueur
 * Calculées à partir de la table user_library
 */
export interface PlayerStats {
  totalGames: number;
  ownedGames: number;
  completedGames: number;
  totalPlayTime: number;
  averageRating: number | null;
}

/**
 * Jeu dans la bibliothèque d'un joueur
 * Inclut les informations du jeu et le statut personnel
 */
export interface PlayerLibraryGame {
  id: string;
  gameId: string;
  slug: string;
  title: string;
  coverImage: string | null;
  status: "owned" | "wishlist" | "completed" | "playing";
  playTimeHours: number;
  rating: number | null;
  addedAt: string;
}

/**
 * Détails complets d'un joueur pour la page de profil
 * Inclut les informations personnelles, stats et bibliothèque
 */
export interface PlayerDetails {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  preferredLocale: string;
  createdAt: string;
  updatedAt: string;
  stats: PlayerStats;
  library: PlayerLibraryGame[];
}

/**
 * Filtres disponibles pour la liste des joueurs
 */
export interface PlayerFilters {
  search?: string;
  gameCountRange?: "0" | "1-5" | "6-20" | "20+";
}

/**
 * Informations de pagination
 */
export interface PlayerPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Réponse de l'API pour la liste des joueurs
 */
export interface PlayersResponse {
  players: PlayerSummary[];
  pagination: PlayerPagination;
}

/**
 * Réponse de l'API pour les détails d'un joueur
 */
export interface PlayerDetailsResponse {
  player: PlayerDetails;
}

/**
 * Plages de nombre de jeux pour le filtrage
 */
export const GAME_COUNT_RANGES = {
  "0": { min: 0, max: 0, label: "0 jeux" },
  "1-5": { min: 1, max: 5, label: "1-5 jeux" },
  "6-20": { min: 6, max: 20, label: "6-20 jeux" },
  "20+": { min: 21, max: Infinity, label: "20+ jeux" },
} as const;

export type GameCountRangeKey = keyof typeof GAME_COUNT_RANGES;
