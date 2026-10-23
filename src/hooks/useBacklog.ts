"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { useAuth } from "./useAuth";
import { useOptimisticMutation } from "./useOptimisticMutation";
import { computeTimeSummary, rankSuggestions } from "@/lib/services/backlog";
import { jsonRequest } from "@/lib/utils/json-request";
import { affect } from "@/lib/swr/optimistic";
import { BACKLOG_KEY } from "@/lib/swr/keys";
import { backlogPriorityUpdater, backlogReorderUpdater } from "@/lib/swr/updaters/backlog";
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
  } = useSWR<BacklogResponse>(user ? BACKLOG_KEY : null, {
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

  const { trigger: reorderTrigger } = useOptimisticMutation<string[]>({
    request: (orderedGameIds) =>
      jsonRequest(`${BACKLOG_KEY}/reorder`, "PATCH", { orderedGameIds }),
    affects: (orderedGameIds) => [
      affect<BacklogResponse>(BACKLOG_KEY, backlogReorderUpdater(orderedGameIds)),
    ],
  });

  const { trigger: priorityTrigger } = useOptimisticMutation<{
    gameId: string;
    priority: BacklogPriority;
  }>({
    request: ({ gameId, priority }) => jsonRequest(`${BACKLOG_KEY}/${gameId}`, "PATCH", { priority }),
    affects: ({ gameId, priority }) => [
      affect<BacklogResponse>(BACKLOG_KEY, backlogPriorityUpdater(gameId, priority)),
    ],
  });

  const reorder = useCallback(
    async (orderedGameIds: string[]) => {
      await reorderTrigger(orderedGameIds);
    },
    [reorderTrigger]
  );

  const setPriority = useCallback(
    async (gameId: string, priority: BacklogPriority) => {
      await priorityTrigger({ gameId, priority });
    },
    [priorityTrigger]
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
