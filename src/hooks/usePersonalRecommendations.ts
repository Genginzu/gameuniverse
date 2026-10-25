"use client";

import { useCallback, useState } from "react";
import { useLocale } from "next-intl";
import useSWR from "swr";

import { personalRecommendationsKey } from "@/lib/swr/keys";
import type { GameRecommendation, PersonalRecommendationsResponse } from "@/types/recommendation";

interface UsePersonalRecommendationsReturn {
  recommendations: GameRecommendation[];
  basedOnGameCount: number;
  loading: boolean;
  /** True while a user-triggered recomputation is running. */
  recomputing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Recomputes server-side (scoring is never cached: one fresh pass). */
  recompute: () => Promise<void>;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Failed to fetch personal recommendations";
}

/** Personal recommendations of the signed-in user, localised to the current locale. */
export function usePersonalRecommendations(): UsePersonalRecommendationsReturn {
  const locale = useLocale();
  const { data, error, isLoading, mutate } = useSWR<PersonalRecommendationsResponse>(
    personalRecommendationsKey(locale),
    { revalidateOnFocus: false }
  );
  const [recomputing, setRecomputing] = useState(false);

  const recompute = useCallback(async () => {
    setRecomputing(true);
    try {
      await mutate();
    } finally {
      setRecomputing(false);
    }
  }, [mutate]);

  return {
    recommendations: data?.recommendations ?? [],
    basedOnGameCount: data?.basedOnGameCount ?? 0,
    loading: isLoading,
    recomputing,
    error: error ? toErrorMessage(error) : null,
    refetch: async () => {
      await mutate();
    },
    recompute,
  };
}
