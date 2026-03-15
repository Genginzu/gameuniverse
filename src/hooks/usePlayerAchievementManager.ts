"use client";

import { useCallback, useRef, useState } from "react";
import type { PlayerSearchResult } from "@/types/admin-achievements";

export interface UsePlayerAchievementManagerReturn {
  players: PlayerSearchResult[];
  selectedPlayer: PlayerSearchResult | null;
  playerAchievements: string[];
  searchLoading: boolean;
  achievementsLoading: boolean;
  error: Error | null;
  searchPlayers: (query: string) => void;
  selectPlayer: (player: PlayerSearchResult) => Promise<void>;
  assignAchievement: (achievementKey: string) => Promise<void>;
  revokeAchievement: (achievementKey: string) => Promise<void>;
}

export function usePlayerAchievementManager(): UsePlayerAchievementManagerReturn {
  const [players, setPlayers] = useState<PlayerSearchResult[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerSearchResult | null>(null);
  const [playerAchievements, setPlayerAchievements] = useState<string[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [achievementsLoading, setAchievementsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedPlayerRef = useRef<PlayerSearchResult | null>(null);

  const fetchPlayerAchievements = useCallback(async (userId: string) => {
    setAchievementsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/achievements/players?userId=${encodeURIComponent(userId)}`
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch player achievements (${response.status})`);
      }

      const data = await response.json();
      setPlayerAchievements(data.achievements ?? []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setAchievementsLoading(false);
    }
  }, []);

  const searchPlayers = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setPlayers([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    setError(null);

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/admin/achievements/players/search?q=${encodeURIComponent(trimmed)}`
        );

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || `Failed to search players (${response.status})`);
        }

        const data = await response.json();
        setPlayers(data.players ?? []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, []);

  const selectPlayer = useCallback(
    async (player: PlayerSearchResult) => {
      setSelectedPlayer(player);
      selectedPlayerRef.current = player;
      await fetchPlayerAchievements(player.id);
    },
    [fetchPlayerAchievements]
  );

  const assignAchievement = useCallback(
    async (achievementKey: string) => {
      const player = selectedPlayerRef.current;
      if (!player) {
        throw new Error("No player selected");
      }

      setError(null);

      try {
        const response = await fetch("/api/admin/achievements/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: player.id, achievementKey }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || `Failed to assign achievement (${response.status})`);
        }

        await fetchPlayerAchievements(player.id);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        throw err;
      }
    },
    [fetchPlayerAchievements]
  );

  const revokeAchievement = useCallback(
    async (achievementKey: string) => {
      const player = selectedPlayerRef.current;
      if (!player) {
        throw new Error("No player selected");
      }

      setError(null);

      try {
        const response = await fetch("/api/admin/achievements/players", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: player.id, achievementKey }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || `Failed to revoke achievement (${response.status})`);
        }

        await fetchPlayerAchievements(player.id);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        throw err;
      }
    },
    [fetchPlayerAchievements]
  );

  return {
    players,
    selectedPlayer,
    playerAchievements,
    searchLoading,
    achievementsLoading,
    error,
    searchPlayers,
    selectPlayer,
    assignAchievement,
    revokeAchievement,
  };
}
