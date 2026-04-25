"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { GamingSession, CreateGamingSessionPayload } from "@/types/gaming-session";
import { GameSessionsService } from "@/lib/services/gameSessionsService";

export function usePlayerSessions(playerId: string, locale: string) {
  const [sessions, setSessions] = useState<GamingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);

  const fetchSessions = useCallback(
    async (page: number, append: boolean) => {
      if (!playerId || isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        append ? setIsLoadingMore(true) : setIsLoading(true);
        setError(null);

        const response = await GameSessionsService.fetchSessions(playerId, page, locale);

        setSessions((prev) => (append ? [...prev, ...response.sessions] : response.sessions));
        setHasNextPage(response.pagination.hasNextPage);
        pageRef.current = page;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch sessions");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [playerId, locale]
  );

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingRef.current) return;
    fetchSessions(pageRef.current + 1, true);
  }, [hasNextPage, fetchSessions]);

  const createSession = useCallback(
    async (payload: CreateGamingSessionPayload) => {
      setIsCreating(true);
      try {
        const newSession = await GameSessionsService.createSession(playerId, payload, locale);
        setSessions((prev) => [newSession, ...prev]);
        return newSession;
      } finally {
        setIsCreating(false);
      }
    },
    [playerId, locale]
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      await GameSessionsService.deleteSession(playerId, sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    },
    [playerId]
  );

  useEffect(() => {
    pageRef.current = 1;
    fetchSessions(1, false);
  }, [fetchSessions]);

  return {
    sessions,
    isLoading,
    isLoadingMore,
    isCreating,
    hasNextPage,
    error,
    loadMore,
    createSession,
    deleteSession,
  };
}
