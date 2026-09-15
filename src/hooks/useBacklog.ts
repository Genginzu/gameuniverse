"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { useAuth } from "./useAuth";
import { computeTimeSummary, rankSuggestions } from "@/lib/services/backlog";
import type {
  BacklogFilters,
  BacklogGame,
  BacklogPriority,
  BacklogResponse,
  BacklogSuggestionContext,
} from "@/types/backlog";

const EMPTY_FILTERS: BacklogFilters = {
  genreIds: [],
  maxHours: null,
  minHours: null,
  platformIds: [],
};

/** Applies the active UI filters to the backlog list. */
function applyFilters(games: BacklogGame[], filters: BacklogFilters): BacklogGame[] {
  return games.filter((game) => {
    if (filters.genreIds.length > 0) {
      const ids = new Set(game.genres.map((g) => g.id).filter(Boolean) as string[]);
      if (!filters.genreIds.some((id) => ids.has(id))) return false;
    }

    if (filters.platformIds.length > 0) {
      const ids = new Set(game.platforms.map((p) => p.id));
      if (!filters.platformIds.some((id) => ids.has(id))) return false;
    }

    if (filters.maxHours !== null) {
      // Keep games with an estimate at or below the cap; drop unknowns.
      if (game.estimatedHours === null || game.estimatedHours > filters.maxHours) return false;
    }

    if (filters.minHours !== null) {
      // Keep games with an estimate at or above the floor; drop unknowns.
      if (game.estimatedHours === null || game.estimatedHours < filters.minHours) return false;
    }

    return true;
  });
}

/**
 * SWR-backed backlog state: fetch, optimistic reorder, priority updates,
 * filters, and the contextual "play next" suggestions.
 */
export function useBacklog() {
  const { user } = useAuth();

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<BacklogResponse>(user ? "/api/library/backlog" : null, {
    onError: () => {},
  });

  const [filters, setFilters] = useState<BacklogFilters>(EMPTY_FILTERS);
  const [suggestionContext, setSuggestionContext] = useState<BacklogSuggestionContext>({
    mood: "any",
  });

  const games = useMemo(() => data?.games ?? [], [data]);
  const filteredGames = useMemo(() => applyFilters(games, filters), [games, filters]);

  const timeSummary = useMemo(() => computeTimeSummary(filteredGames), [filteredGames]);
  const suggestions = useMemo(
    () => rankSuggestions(filteredGames, suggestionContext, 3),
    [filteredGames, suggestionContext]
  );

  // Available genres/platforms for the filter UI, derived from the backlog.
  const availableGenres = useMemo(() => {
    const map = new Map<string, string>();
    for (const game of games) {
      for (const genre of game.genres) {
        if (genre.id) map.set(genre.id, genre.name);
      }
    }
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [games]);

  const availablePlatforms = useMemo(() => {
    const map = new Map<string, string>();
    for (const game of games) {
      for (const platform of game.platforms) {
        map.set(platform.id, platform.name);
      }
    }
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [games]);

  const reorder = useCallback(
    async (orderedGameIds: string[]) => {
      // Optimistic reordering: reflect the new order immediately.
      const optimistic: BacklogGame[] = [];
      orderedGameIds.forEach((id, index) => {
        const game = games.find((g) => g.id === id);
        if (game) optimistic.push({ ...game, backlogPosition: index });
      });

      await mutate(
        async () => {
          const response = await fetch("/api/library/backlog/reorder", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderedGameIds }),
          });
          if (!response.ok) throw new Error("Failed to reorder backlog");
          return { games: optimistic };
        },
        {
          optimisticData: { games: optimistic },
          rollbackOnError: true,
          revalidate: true,
        }
      );
    },
    [games, mutate]
  );

  const setPriority = useCallback(
    async (gameId: string, priority: BacklogPriority) => {
      const optimistic = games.map((g) => (g.id === gameId ? { ...g, priority } : g));

      await mutate(
        async () => {
          const response = await fetch(`/api/library/backlog/${gameId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ priority }),
          });
          if (!response.ok) throw new Error("Failed to update priority");
          return { games: optimistic };
        },
        {
          optimisticData: { games: optimistic },
          rollbackOnError: true,
          revalidate: true,
        }
      );
    },
    [games, mutate]
  );

  const hasActiveFilters =
    filters.genreIds.length > 0 ||
    filters.platformIds.length > 0 ||
    filters.maxHours !== null ||
    filters.minHours !== null;

  const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  return {
    games,
    filteredGames,
    timeSummary,
    suggestions,
    availableGenres,
    availablePlatforms,
    filters,
    setFilters,
    hasActiveFilters,
    clearFilters,
    suggestionContext,
    setSuggestionContext,
    loading: isLoading,
    error: error ? "Failed to fetch backlog" : null,
    reorder,
    setPriority,
    refetch: () => mutate(),
  };
}
