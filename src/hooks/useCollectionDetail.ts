"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useLocale } from "next-intl";
import type { CollectionDetail } from "@/types/collection";

interface UseCollectionDetailReturn {
  collection: CollectionDetail | null;
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook pour récupérer le détail d'une collection via son slug.
 * Gère le chargement, les erreurs et le cas 404 (collection inexistante ou privée).
 */
export function useCollectionDetail(playerId: string, slug: string): UseCollectionDetailReturn {
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const hasFetchedRef = useRef(false);
  const locale = useLocale();

  const fetchDetail = useCallback(async () => {
    if (!playerId || !slug) return;

    try {
      setIsLoading(true);
      setError(null);
      setNotFound(false);

      const response = await fetch(`/api/players/${playerId}/collections/${slug}?locale=${locale}`);

      if (response.status === 404) {
        setNotFound(true);
        setCollection(null);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch collection detail");
      }

      const data = await response.json();
      setCollection(data.collection ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch collection detail";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [playerId, slug, locale]);

  useEffect(() => {
    if (hasFetchedRef.current || !playerId || !slug) {
      if (!playerId || !slug) setIsLoading(false);
      return;
    }
    hasFetchedRef.current = true;
    fetchDetail();
  }, [playerId, slug, fetchDetail]);

  return { collection, isLoading, error, notFound, refetch: fetchDetail };
}
