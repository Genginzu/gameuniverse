"use client";

import useSWR from "swr";
import type { GameRecommendation } from "@/types/recommendation";

interface RecommendationsResponse {
  recommendations: GameRecommendation[];
}

interface UseRecommendationsReturn {
  recommendations: GameRecommendation[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook pour fetch les recommandations d'un jeu via SWR.
 * Cache automatique + revalidation au focus.
 */
export function useRecommendations(gameSlug: string): UseRecommendationsReturn {
  const { data, error, isLoading, mutate } = useSWR<RecommendationsResponse>(
    gameSlug ? `/api/games/${gameSlug}/recommendations` : null
  );

  return {
    recommendations: data?.recommendations ?? [],
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Failed to fetch recommendations"
      : null,
    refetch: async () => {
      await mutate();
    },
  };
}
