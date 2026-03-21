"use client";

import useSWR from "swr";
import { useLocale } from "next-intl";
import type { CollectionSummary } from "@/types/collection";

interface CollectionsResponse {
  collections: CollectionSummary[];
}

interface UseCollectionsReturn {
  collections: CollectionSummary[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook pour récupérer les collections d'un joueur.
 * SWR gère le cache, la déduplication et la revalidation.
 */
export function useCollections(playerId: string): UseCollectionsReturn {
  const locale = useLocale();

  const { data, error, isLoading, mutate } = useSWR<CollectionsResponse>(
    playerId ? `/api/players/${playerId}/collections?locale=${locale}` : null
  );

  return {
    collections: data?.collections ?? [],
    isLoading,
    error: error ? (error instanceof Error ? error.message : "Failed to fetch collections") : null,
    refetch: async () => {
      await mutate();
    },
  };
}
