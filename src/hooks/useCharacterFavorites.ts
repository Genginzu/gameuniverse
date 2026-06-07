"use client";

import useSWR from "swr";
import { useLocale } from "next-intl";
import type { CharacterFavoriteSummary } from "@/types/character";

export interface UseCharacterFavoritesReturn {
  characters: CharacterFavoriteSummary[];
  loading: boolean;
  error: string | null;
}

interface CharacterFavoritesResponse {
  characters: CharacterFavoriteSummary[];
}

/**
 * Hook for the current user's favorites page.
 * Fetches from GET /api/favorites/characters (auth required).
 */
export function useCharacterFavorites(): UseCharacterFavoritesReturn {
  const locale = useLocale();

  const { data, error, isLoading } = useSWR<CharacterFavoritesResponse>(
    `/api/favorites/characters?locale=${locale}`
  );

  return {
    characters: data?.characters ?? [],
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : "Failed to fetch favorites") : null,
  };
}
