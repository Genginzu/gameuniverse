"use client";

import useSWR from "swr";
import { useLocale } from "next-intl";
import type { CollectionDetail } from "@/types/collection";
import { ErrorType } from "@/lib/error-handling";

interface CollectionDetailResponse {
  collection: CollectionDetail;
}

interface TypedError extends Error {
  type?: ErrorType;
  statusCode?: number;
}

interface UseCollectionDetailReturn {
  collection: CollectionDetail | null;
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
    playerId && slug ? `/api/players/${playerId}/collections/${slug}?locale=${locale}` : null
  );

  // Détecter le 404 via l'erreur typée de l'ApiClient
  const typedError = error as TypedError | undefined;
  const notFound = typedError?.type === ErrorType.NOT_FOUND || typedError?.statusCode === 404;

  return {
    collection: data?.collection ?? null,
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
