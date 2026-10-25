"use client";

import useSWR from "swr";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { fetcher } from "@/lib/swr/fetcher";
import type { HybridSearchResponse, SearchResultItem } from "@/types/search";

const MAX_RESULTS_PER_SOURCE = 10;

/**
 * Debounced game search over the catalogue and IGDB (`/api/search/hybrid`),
 * from 2 characters: local games first, then IGDB games not imported yet.
 */
export function useAdminGameSearch(query: string, locale: string) {
  const debounced = useDebouncedValue(query.trim(), 300);
  const key =
    debounced.length >= 2
      ? `/api/search/hybrid?query=${encodeURIComponent(debounced)}&locale=${locale}` +
        `&localLimit=${MAX_RESULTS_PER_SOURCE}&igdbLimit=${MAX_RESULTS_PER_SOURCE}`
      : null;
  const { data, isLoading } = useSWR<HybridSearchResponse>(key, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
  const results: SearchResultItem[] = key ? (data?.results ?? []) : [];
  return { results, searching: isLoading };
}
