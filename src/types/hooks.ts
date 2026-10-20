// Types pour les hooks personnalisés

import { GameDetails, GameSummary } from "./game";
import { RoleFilterOption } from "./character";
import { PlatformFilterOption } from "./platform";

export interface UseGameDetailsReturn {
  game: GameDetails | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseGamesOptions {
  search?: string;
  genres?: string[];
  platforms?: string[];
  page?: number;
  limit?: number;
  locale?: string;
  fields?: string[];
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

// --- Characters ---

export interface UseCharacterFiltersReturn {
  roles: RoleFilterOption[];
  platforms: PlatformFilterOption[];
  rolesLoading: boolean;
  platformsLoading: boolean;
}
