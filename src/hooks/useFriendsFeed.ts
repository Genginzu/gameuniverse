"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { FeedEvent, FeedEventType } from "@/types/feed";
import { FriendsFeedService } from "@/lib/services/friendsFeedService";

export type FeedFilter = FeedEventType | "all";

export interface UseFriendsFeedReturn {
  events: FeedEvent[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  activeFilter: FeedFilter;
  error: string | null;
  setFilter: (filter: FeedFilter) => void;
  loadMore: () => void;
}

export function useFriendsFeed(locale: string): UseFriendsFeedReturn {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);

  const fetchEvents = useCallback(
    async (page: number, append: boolean) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        if (append) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const params = {
          page,
          locale,
          ...(activeFilter !== "all" && { type: activeFilter }),
        };

        const response = await FriendsFeedService.fetchFeed(params);

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
    [locale, activeFilter]
  );

  const setFilter = useCallback((filter: FeedFilter) => {
    setActiveFilter(filter);
    setEvents([]);
    pageRef.current = 1;
  }, []);

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingRef.current) return;
    fetchEvents(pageRef.current + 1, true);
  }, [hasNextPage, fetchEvents]);

  useEffect(() => {
    fetchEvents(1, false);
  }, [fetchEvents]);

  return {
    events,
    isLoading,
    isLoadingMore,
    hasNextPage,
    activeFilter,
    error,
    setFilter,
    loadMore,
  };
}
