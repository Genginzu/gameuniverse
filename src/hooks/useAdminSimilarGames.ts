"use client";

import useSWR from "swr";
import { useState } from "react";

export interface AdminSimilarGame {
  id: string;
  similarIgdbId: number;
  displayOrder: number;
  game: {
    id: string;
    slug: string;
    title: string;
    coverImage: string | null;
  } | null;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  const json = await res.json();
  return Array.isArray(json) ? json : [];
};

export function useAdminSimilarGames(gameId?: string) {
  const { data, error, isLoading, mutate } = useSWR<AdminSimilarGame[]>(
    gameId ? `/api/admin/games/${gameId}/similar-games` : null,
    fetcher
  );

  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const addSimilarGame = async (gameSlug: string): Promise<{ ok: boolean; error?: string }> => {
    if (!gameId) return { ok: false, error: "No game ID" };
    setAdding(true);
    try {
      const res = await fetch(`/api/admin/games/${gameId}/similar-games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameSlug }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { ok: false, error: body.error || "Failed to add" };
      }
      await mutate();
      return { ok: true };
    } finally {
      setAdding(false);
    }
  };

  const removeSimilarGame = async (entryId: string): Promise<boolean> => {
    if (!gameId) return false;
    setRemoving(entryId);
    try {
      const res = await fetch(`/api/admin/games/${gameId}/similar-games?entryId=${entryId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await mutate();
        return true;
      }
      return false;
    } finally {
      setRemoving(null);
    }
  };

  return {
    similarGames: data ?? [],
    loading: isLoading,
    error: error ? "Failed to load similar games" : null,
    adding,
    removing,
    addSimilarGame,
    removeSimilarGame,
  };
}
