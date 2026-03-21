"use client";

import useSWR from "swr";
import type { GameRecommendation } from "@/types/recommendation";

interface PersonalRecommendationsResponse {
  recommendations: GameRecommendation[];
  basedOnGameCount: number;
}

interface UsePersonalRecommendationsReturn {
  recommendations: GameRecommendation[];
  basedOnGameCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook pour fetch les recommandations personnalisées via SWR.
 * Agrège les recommandations de tous les jeux de la bibliothèque du joueur.
 */
export function usePersonalRecommendations(): UsePersonalRecommendationsReturn {
  const { data, error, isLoading, mutate } = useSWR<PersonalRecommendationsResponse>(
    "/api/recommendations/personal"
  );

  return {
    recommendations: data?.recommendations ?? [],
    basedOnGameCount: data?.basedOnGameCount ?? 0,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Failed to fetch personal recommendations"
      : null,
    refetch: async () => {
      await mutate();
    },
  };
}
