"use client";

import useSWR from "swr";

import { LIBRARY_STATS_ENDPOINT, type LibraryStats } from "@/types/library";

interface UseLibraryStatsReturn {
  /** `null` until loaded (or when the request failed). */
  stats: LibraryStats | null;
  isLoading: boolean;
}

/**
 * Aggregated library stats of the current user (`/api/library/stats`).
 *
 * Prefer this over `useUserLibrary` when only counts are needed: the full
 * library endpoint loads every game with its embeds and can time out on
 * large libraries.
 */
export function useLibraryStats(): UseLibraryStatsReturn {
  const { data, isLoading } = useSWR<LibraryStats>(LIBRARY_STATS_ENDPOINT, {
    onError: () => {},
  });

  return { stats: data ?? null, isLoading };
}
