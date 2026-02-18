"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useLocale } from "next-intl";
import type { CollectionSummary } from "@/types/collection";

interface UseCollectionsReturn {
  collections: CollectionSummary[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook pour récupérer les collections d'un joueur.
 * Gère le chargement, les erreurs et le rafraîchissement.
 */
export function useCollections(playerId: string): UseCollectionsReturn {
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);
  const locale = useLocale();

  const fetchCollections = useCallback(async () => {
    if (!playerId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/players/${playerId}/collections?locale=${locale}`);

      if (!response.ok) {
        throw new Error("Failed to fetch collections");
      }

      const data = await response.json();
      setCollections(data.collections ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch collections";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [playerId, locale]);

  // Chargement initial — une seule fois
  useEffect(() => {
    if (hasFetchedRef.current || !playerId) {
      if (!playerId) setIsLoading(false);
      return;
    }
    hasFetchedRef.current = true;
    fetchCollections();
  }, [playerId, fetchCollections]);

  return { collections, isLoading, error, refetch: fetchCollections };
}
