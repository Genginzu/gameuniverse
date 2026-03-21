"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { useAuth } from "./useAuth";

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
  } = useSWR<LibraryResponse>(user ? "/api/library" : null, {
    onError: () => {},
  });

  // SWR pour les stats — endpoint séparé, cache indépendant
  const { data: statsData, mutate: mutateStats } = useSWR<LibraryStats>(
    user ? "/api/library/stats" : null,
    {
      onError: () => {},
    }
  );

  const games = libraryData?.games ?? [];
  const stats = statsData ?? DEFAULT_STATS;

  const addToLibrary = useCallback(
    async (gameId: string, status = "owned") => {
      if (!user) return false;

      try {
        const response = await fetch("/api/library", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId, status }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to add game to library");
        }

        // Revalider les deux caches
        await Promise.all([mutateLibrary(), mutateStats()]);
        return true;
      } catch {
        return false;
      }
    },
    [user, mutateLibrary, mutateStats]
  );

  const removeFromLibrary = useCallback(
    async (gameId: string) => {
      if (!user) return false;

      try {
        const response = await fetch(`/api/library/${gameId}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to remove game from library");

        await Promise.all([mutateLibrary(), mutateStats()]);
        return true;
      } catch {
        return false;
      }
    },
    [user, mutateLibrary, mutateStats]
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
