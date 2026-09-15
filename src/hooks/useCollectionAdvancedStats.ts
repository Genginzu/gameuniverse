"use client";

import useSWR from "swr";
import { useLocale } from "next-intl";
import type { CollectionAdvancedStats } from "@/types/playerCollection";

interface CollectionAdvancedStatsResponse {
  stats: CollectionAdvancedStats;
}

interface UseCollectionAdvancedStatsReturn {
  stats: CollectionAdvancedStats | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook fetching aggregated advanced stats for a player's collections
 * (genre/platform distribution, average rating, completion rate, playtime).
 */
export function useCollectionAdvancedStats(playerId: string): UseCollectionAdvancedStatsReturn {
  const locale = useLocale();

  const { data, error, isLoading } = useSWR<CollectionAdvancedStatsResponse>(
    playerId ? `/api/players/${playerId}/collections/stats?locale=${locale}` : null
  );

  return {
    stats: data?.stats ?? null,
    isLoading,
    error: error ? (error instanceof Error ? error.message : "Failed to fetch stats") : null,
  };
}
