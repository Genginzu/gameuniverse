"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";

import { fetcher } from "@/lib/swr/fetcher";
import type { AdminFranchiseGame } from "@/types/admin-franchises";

/** Games of a franchise in the admin, with link / unlink mutations. */
export function useAdminFranchiseGames(franchiseId: string, locale: string) {
  const base = `/api/admin/franchises/${encodeURIComponent(franchiseId)}/games`;
  const { data, error, isLoading, mutate } = useSWR<{ games: AdminFranchiseGame[] }>(
    `${base}?locale=${locale}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  const [pendingId, setPendingId] = useState<string | null>(null);

  const run = useCallback(
    async (gameId: string, request: () => Promise<Response>) => {
      setPendingId(gameId);
      try {
        const response = await request();
        if (!response.ok) return false;
        await mutate();
        return true;
      } finally {
        setPendingId(null);
      }
    },
    [mutate]
  );

  const addGame = (key: string, target: { gameId: string } | { igdbId: number }) =>
    run(key, () =>
      fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(target),
      })
    );
  const removeGame = (gameId: string) =>
    run(gameId, () => fetch(`${base}/${encodeURIComponent(gameId)}`, { method: "DELETE" }));

  return {
    games: data?.games ?? [],
    loading: isLoading,
    error: error as Error | undefined,
    pendingId,
    addGame,
    removeGame,
  };
}
