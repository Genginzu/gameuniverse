"use client";

import useSWR from "swr";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { fetcher } from "@/lib/swr/fetcher";
import type { ShowcaseIgdbResult } from "@/types/home";

/** Debounced IGDB search (admin) feeding the "import from IGDB" part of the picker. */
export function useShowcaseIgdbSearch(query: string, enabled: boolean) {
  const debounced = useDebouncedValue(query.trim(), 400);
  const key =
    enabled && debounced.length >= 2
      ? `/api/admin/library-sync/igdb-search?q=${encodeURIComponent(debounced)}&limit=30`
      : null;
  const { data, error, isLoading } = useSWR<ShowcaseIgdbResult[]>(key, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  return {
    results: key ? (data ?? []) : [],
    searching: isLoading || (enabled && query.trim().length >= 2 && debounced !== query.trim()),
    failed: !!error,
  };
}
