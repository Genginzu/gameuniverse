"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";

import { fetcher } from "@/lib/swr/fetcher";
import type { GameRecommendation } from "@/types/recommendation";

interface PersonalRecommendationsResponse {
  recommendations: GameRecommendation[];
  basedOnGameCount: number;
}

interface UsePersonalRecommendationsReturn {
  recommendations: GameRecommendation[];
  basedOnGameCount: number;
  loading: boolean;
  /** True while a user-triggered recomputation is running. */
  recomputing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Recomputes server-side, bypassing the cached aggregate. */
  recompute: () => Promise<void>;
}

const ENDPOINT = "/api/recommendations/personal";

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Failed to fetch personal recommendations";
}

/**
 * Hook pour fetch les recommandations personnalisées via SWR.
 * Agrège les recommandations de tous les jeux de la bibliothèque du joueur.
 */
export function usePersonalRecommendations(): UsePersonalRecommendationsReturn {
  const { data, error, isLoading, mutate } = useSWR<PersonalRecommendationsResponse>(ENDPOINT);
  const [recomputing, setRecomputing] = useState(false);
  const [recomputeError, setRecomputeError] = useState<string | null>(null);

  const recompute = useCallback(async () => {
    setRecomputing(true);
    setRecomputeError(null);
    try {
      const fresh = await fetcher<PersonalRecommendationsResponse>(`${ENDPOINT}?refresh=1`);
      await mutate(fresh, { revalidate: false });
    } catch (recomputeFailure) {
      setRecomputeError(toErrorMessage(recomputeFailure));
    } finally {
      setRecomputing(false);
    }
  }, [mutate]);

  return {
    recommendations: data?.recommendations ?? [],
    basedOnGameCount: data?.basedOnGameCount ?? 0,
    loading: isLoading,
    recomputing,
    error: recomputeError ?? (error ? toErrorMessage(error) : null),
    refetch: async () => {
      await mutate();
    },
    recompute,
  };
}
