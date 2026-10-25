"use client";

import useSWR from "swr";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { fetcher } from "@/lib/swr/fetcher";
import type { AdminMetadataOption, AdminMetadataSearchKind } from "@/types/game-metadata";

const MIN_QUERY_LENGTH = 2;

/** Debounced name search in a large IGDB reference table (franchises, engines…). */
export function useAdminMetadataSearch(kind: AdminMetadataSearchKind, query: string) {
  const debounced = useDebouncedValue(query.trim(), 250);
  const key =
    debounced.length >= MIN_QUERY_LENGTH
      ? `/api/admin/game-metadata?kind=${kind}&q=${encodeURIComponent(debounced)}`
      : null;
  const { data, isLoading } = useSWR<{ items: AdminMetadataOption[] }>(key, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
  return { results: key ? (data?.items ?? []) : [], loading: isLoading };
}
