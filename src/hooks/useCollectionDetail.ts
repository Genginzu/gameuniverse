"use client";

import useSWR from "swr";
import { useLocale } from "next-intl";
import type { CollectionDetail, CollectionDetailResponse } from "@/types/collection";
import type { CollectionAdvancedStats } from "@/types/playerCollection";
import { ErrorType } from "@/lib/error-handling";
import { collectionDetailKey } from "@/lib/swr/keys";

interface TypedError extends Error {
  type?: ErrorType;
  statusCode?: number;
}

interface UseCollectionDetailReturn {
  collection: CollectionDetail | null;
  stats: CollectionAdvancedStats | null;
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook pour récupérer le détail d'une collection via son slug.
 * Gère le cas 404 (collection inexistante ou privée) via l'erreur SWR.
 */
export function useCollectionDetail(playerId: string, slug: string): UseCollectionDetailReturn {
  const locale = useLocale();

  const { data, error, isLoading, mutate } = useSWR<CollectionDetailResponse>(
    playerId && slug ? collectionDetailKey(playerId, slug, locale) : null
  );

  // Détecter le 404 via l'erreur typée de l'ApiClient
  const typedError = error as TypedError | undefined;
  const notFound = typedError?.type === ErrorType.NOT_FOUND || typedError?.statusCode === 404;

  return {
    collection: data?.collection ?? null,
    stats: data?.stats ?? null,
    isLoading,
    error:
      error && !notFound
        ? error instanceof Error
          ? error.message
          : "Failed to fetch collection detail"
        : null,
    notFound,
    refetch: async () => {
      await mutate();
    },
  };
}
