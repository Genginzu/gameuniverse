"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  PlayerReviewItem,
  PlayerReviewsStatsData,
  ReviewSortOption,
} from "@/types/playerReview";
import { PlayerReviewsService } from "@/lib/services/playerReviewsService";

/**
 * Hook pour gérer les avis d'un joueur.
 * Gère le chargement initial, la pagination incrémentale, le tri et les statistiques.
 * Les stats sont chargées avec la première page et conservées lors des pages suivantes.
 */
export function usePlayerReviews(playerId: string, locale: string) {
  const [reviews, setReviews] = useState<PlayerReviewItem[]>([]);
  const [stats, setStats] = useState<PlayerReviewsStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [sortOption, setSortOption] = useState<ReviewSortOption>("date_desc");
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);

  const fetchReviews = useCallback(
    async (page: number, append: boolean) => {
      if (!playerId || isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        append ? setIsLoadingMore(true) : setIsLoading(true);
        setError(null);

        const response = await PlayerReviewsService.fetchReviews(playerId, {
          page,
          sort: sortOption,
          locale,
        });

        setReviews((prev) => (append ? [...prev, ...response.reviews] : response.reviews));
        setHasNextPage(response.pagination.hasNextPage);
        pageRef.current = page;

        // Stats loaded once with page 1, preserved across subsequent pages
        if (page === 1) setStats(response.stats);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch reviews";
        setError(message);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [playerId, locale, sortOption]
  );

  const setSort = useCallback((option: ReviewSortOption) => {
    setSortOption(option);
    setReviews([]);
    pageRef.current = 1;
  }, []);

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingRef.current) return;
    fetchReviews(pageRef.current + 1, true);
  }, [hasNextPage, fetchReviews]);

  useEffect(() => {
    fetchReviews(1, false);
  }, [fetchReviews]);

  return {
    reviews,
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
