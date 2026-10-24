"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { useAuth } from "./useAuth";
import { useLibraryToggle, type LibraryToggleArgs } from "./useLibraryToggle";
import { LIBRARY_LIST_KEY, LIBRARY_STATS_KEY } from "@/lib/swr/keys";

interface LibraryGame {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverImage?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  releaseDate?: string;
  releaseYear?: number;
  genres: Array<{ name: string; id?: string }>;
  developer: string;
  publisher: string;
  metascore?: number;
  libraryStatus: string;
  addedAt: string;
  playTimeHours: number;
  userRating?: number;
  notes?: string;
}

interface LibraryStats {
  totalGames: number;
  ownedGames: number;
  completedGames: number;
  totalPlayTime: number;
  averageRating?: number;
}

interface LibraryResponse {
  games: LibraryGame[];
}

const DEFAULT_STATS: LibraryStats = {
  totalGames: 0,
  ownedGames: 0,
  completedGames: 0,
  totalPlayTime: 0,
};

export function useUserLibrary() {
  const { user } = useAuth();

  // SWR pour les jeux de la bibliothèque
  const {
    data: libraryData,
    error: libraryError,
    isLoading: libraryLoading,
    mutate: mutateLibrary,
  } = useSWR<LibraryResponse>(user ? LIBRARY_LIST_KEY : null, {
    onError: () => {},
  });

  // SWR pour les stats — endpoint séparé, cache indépendant
  const { data: statsData, mutate: mutateStats } = useSWR<LibraryStats>(
    user ? LIBRARY_STATS_KEY : null,
    {
      onError: () => {},
    }
  );

  const games = libraryData?.games ?? [];
  const stats = statsData ?? DEFAULT_STATS;
  const { trigger: toggleLibrary } = useLibraryToggle();

  const setInLibrary = useCallback(
    async (args: LibraryToggleArgs) => {
      if (!user) return false;
      try {
        return (await toggleLibrary(args)) !== undefined;
      } catch {
        return false;
      }
    },
    [user, toggleLibrary]
  );

  const addToLibrary = useCallback(
    (gameId: string, status = "owned") => setInLibrary({ gameId, inLibrary: true, status }),
    [setInLibrary]
  );

  const removeFromLibrary = useCallback(
    (gameId: string) => setInLibrary({ gameId, inLibrary: false }),
    [setInLibrary]
  );

  const isInLibrary = useCallback(
    async (gameId: string) => {
      if (!user) return false;

      try {
        const response = await fetch(`/api/library/${gameId}`);
        if (!response.ok) return false;
        const data = await response.json();
        return data.inLibrary;
      } catch {
        return false;
      }
    },
    [user]
  );

  return {
    games,
    stats,
    loading: libraryLoading,
    error: libraryError
      ? libraryError instanceof Error
        ? libraryError.message
        : "Failed to fetch library"
      : null,
    addToLibrary,
    removeFromLibrary,
    isInLibrary,
    refetch: () => Promise.all([mutateLibrary(), mutateStats()]),
  };
}
