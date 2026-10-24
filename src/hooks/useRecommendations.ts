"use client";

import { useLocale } from "next-intl";
import useSWR from "swr";

import { gameRecommendationsKey } from "@/lib/swr/keys";
import type { GameRecommendation, RecommendationsResponse } from "@/types/recommendation";

interface UseRecommendationsReturn {
  recommendations: GameRecommendation[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** Games like `gameSlug`, localised to the current locale. */
export function useRecommendations(gameSlug: string): UseRecommendationsReturn {
  const locale = useLocale();
  const { data, error, isLoading, mutate } = useSWR<RecommendationsResponse>(
    gameSlug ? gameRecommendationsKey(gameSlug, locale) : null
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
