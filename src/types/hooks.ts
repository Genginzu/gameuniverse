// Types pour les hooks personnalisés

import { GameDetails, GameSummary } from "./game";
import { CharacterSummary, RoleFilterOption } from "./character";
import { PlatformFilterOption } from "./platform";
import { Pagination } from "./pagination";

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

export interface UseCharactersOptions {
  search?: string;
  roles?: string[];
  platforms?: string[];
  page?: number;
  limit?: number;
  locale?: string;
}

export interface UseCharactersReturn {
  characters: CharacterSummary[];
  pagination: Pagination | null;
  isLoading: boolean;
  isValidating: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseCharacterFiltersReturn {
  roles: RoleFilterOption[];
  platforms: PlatformFilterOption[];
  rolesLoading: boolean;
  platformsLoading: boolean;
}
