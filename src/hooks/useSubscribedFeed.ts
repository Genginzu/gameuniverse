"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { FeedEvent } from "@/types/feed";
import { SubscriptionService } from "@/lib/services/subscriptionService";

export interface UseSubscribedFeedReturn {
  events: FeedEvent[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  error: string | null;
  loadMore: () => void;
}

/**
 * Hook pour le fil d'actualité agrégé des joueurs suivis (propriétaire).
 * Gère le chargement initial + pagination incrémentale (page++ à chaque loadMore).
 */
export function useSubscribedFeed(viewerId: string, locale: string): UseSubscribedFeedReturn {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);

  const fetchEvents = useCallback(
    async (page: number, append: boolean) => {
      if (!viewerId || isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        if (append) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const response = await SubscriptionService.fetchFeed(viewerId, { page, locale });

        setEvents((prev) => (append ? [...prev, ...response.events] : response.events));
        setHasNextPage(response.pagination.hasNextPage);
        pageRef.current = page;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch feed";
        setError(message);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [viewerId, locale]
  );

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingRef.current) return;
    fetchEvents(pageRef.current + 1, true);
  }, [hasNextPage, fetchEvents]);

  useEffect(() => {
    fetchEvents(1, false);
  }, [fetchEvents]);

  return { events, isLoading, isLoadingMore, hasNextPage, error, loadMore };
}
