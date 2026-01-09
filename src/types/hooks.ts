// Types pour les hooks personnalisés

import { GameDetails, GameSummary } from "./game";

export interface UseGameDetailsReturn {
  game: GameDetails | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseGamesOptions {
  search?: string;
  genres?: string[];
  page?: number;
  limit?: number;
  locale?: string;
}

export interface UseGamesReturn {
  games: GameSummary[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
