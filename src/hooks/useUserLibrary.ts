"use client";

import { useState, useEffect, useCallback } from "react";
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

export function useUserLibrary() {
  const { user } = useAuth();
  const [games, setGames] = useState<LibraryGame[]>([]);
  const [stats, setStats] = useState<LibraryStats>({
    totalGames: 0,
    ownedGames: 0,
    completedGames: 0,
    totalPlayTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's library
  const fetchLibrary = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/library");
      if (!response.ok) {
        throw new Error("Failed to fetch library");
      }

      const data = await response.json();
      setGames(data.games || []);
    } catch (err) {
      console.error("Error fetching library:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch library");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch library statistics
  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/library/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch library stats");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching library stats:", err);
    }
  }, [user]);

  // Add game to library
  const addToLibrary = useCallback(
    async (gameId: string, status = "owned") => {
      if (!user) return false;

      try {
        const response = await fetch("/api/library", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ gameId, status }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to add game to library");
        }

        // Refresh library and stats
        await Promise.all([fetchLibrary(), fetchStats()]);
        return true;
      } catch (err) {
        console.error("Error adding game to library:", err);
        setError(err instanceof Error ? err.message : "Failed to add game to library");
        return false;
      }
    },
    [user, fetchLibrary, fetchStats]
  );

  // Remove game from library
  const removeFromLibrary = useCallback(
    async (gameId: string) => {
      if (!user) return false;

      try {
        const response = await fetch(`/api/library/${gameId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to remove game from library");
        }

        // Refresh library and stats
        await Promise.all([fetchLibrary(), fetchStats()]);
        return true;
      } catch (err) {
        console.error("Error removing game from library:", err);
        setError(err instanceof Error ? err.message : "Failed to remove game from library");
        return false;
      }
    },
    [user, fetchLibrary, fetchStats]
  );

  // Check if game is in library
  const isInLibrary = useCallback(
    async (gameId: string) => {
      if (!user) return false;

      try {
        const response = await fetch(`/api/library/${gameId}`);
        if (!response.ok) {
          return false;
        }

        const data = await response.json();
        return data.inLibrary;
      } catch (err) {
        console.error("Error checking library status:", err);
        return false;
      }
    },
    [user]
  );

  // Initial load
  useEffect(() => {
    if (user) {
      Promise.all([fetchLibrary(), fetchStats()]);
    } else {
      setLoading(false);
      setGames([]);
      setStats({
        totalGames: 0,
        ownedGames: 0,
        completedGames: 0,
        totalPlayTime: 0,
      });
    }
  }, [user, fetchLibrary, fetchStats]);

  return {
    games,
    stats,
    loading,
    error,
    addToLibrary,
    removeFromLibrary,
    isInLibrary,
    refetch: () => Promise.all([fetchLibrary(), fetchStats()]),
  };
}
