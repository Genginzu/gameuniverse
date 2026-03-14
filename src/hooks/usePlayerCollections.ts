"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { CollectionSummary } from "@/types/collection";
import type { CollectionSortOption, PlayerCollectionsStatsData } from "@/types/playerCollection";
import { PlayerCollectionsService } from "@/lib/services/playerCollectionsService";

/**
 * Hook pour gérer les collections d'un joueur.
 * Gère le chargement initial, la pagination incrémentale, le tri et les statistiques.
 * Les stats sont chargées avec la première page et conservées lors des pages suivantes.
 */
export function usePlayerCollections(playerId: string, locale: string, _isOwner: boolean) {
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [stats, setStats] = useState<PlayerCollectionsStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [sortOption, setSortOption] = useState<CollectionSortOption>("updated_at_desc");
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);

  const fetchCollections = useCallback(
    async (page: number, append: boolean) => {
      if (!playerId || isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        append ? setIsLoadingMore(true) : setIsLoading(true);
        setError(null);

        const response = await PlayerCollectionsService.fetchCollections(playerId, {
          page,
          sort: sortOption,
          locale,
        });

        setCollections((prev) =>
          append ? [...prev, ...response.collections] : response.collections
        );
        setHasNextPage(response.pagination.hasNextPage);
        pageRef.current = page;

        // Stats loaded once with page 1, preserved across subsequent pages
        if (page === 1) setStats(response.stats);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch collections";
        setError(message);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [playerId, locale, sortOption]
  );

  const setSort = useCallback((option: CollectionSortOption) => {
    setSortOption(option);
    setCollections([]);
    pageRef.current = 1;
  }, []);

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingRef.current) return;
    fetchCollections(pageRef.current + 1, true);
  }, [hasNextPage, fetchCollections]);

  useEffect(() => {
    fetchCollections(1, false);
  }, [fetchCollections]);

  return {
    collections,
    stats,
    isLoading,
    isLoadingMore,
    hasNextPage,
    sortOption,
    error,
    setSort,
    loadMore,
  };
}
