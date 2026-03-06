"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ActivityEvent, ActivityEventType } from "@/types/activity";
import { ActivityService } from "@/lib/services/activityService";

export type ActivityFilter = ActivityEventType | "all";

export interface UsePlayerActivityReturn {
  events: ActivityEvent[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  activeFilter: ActivityFilter;
  error: string | null;
  setFilter: (type: ActivityFilter) => void;
  loadMore: () => void;
}

/**
 * Hook pour gérer le flux d'activité d'un joueur.
 * Gère le chargement initial, la pagination incrémentale et le filtrage par type.
 */
export function usePlayerActivity(playerId: string, locale: string): UsePlayerActivityReturn {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);

  const fetchEvents = useCallback(
    async (page: number, append: boolean) => {
      if (!playerId || isFetchingRef.current) return;
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

        const response = await ActivityService.fetchActivity(playerId, params);

        setEvents((prev) => (append ? [...prev, ...response.events] : response.events));
        setHasNextPage(response.pagination.hasNextPage);
        pageRef.current = page;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch activity";
        setError(message);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [playerId, locale, activeFilter]
  );

  const setFilter = useCallback((type: ActivityFilter) => {
    setActiveFilter(type);
    setEvents([]);
    pageRef.current = 1;
  }, []);

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingRef.current) return;
    fetchEvents(pageRef.current + 1, true);
  }, [hasNextPage, fetchEvents]);

  // Chargement initial et rechargement lors du changement de filtre
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
