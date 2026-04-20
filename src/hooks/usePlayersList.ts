import { useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import type { PlayersResponse } from "@/types/player";

function buildPlayersKey(search: string, gameCountRange: string, page: number) {
  const params = new URLSearchParams({ page: page.toString(), limit: "20" });
  if (search.trim()) params.append("search", search.trim());
  if (gameCountRange) params.append("gameCountRange", gameCountRange);
  return `/api/players?${params.toString()}`;
}

export function usePlayersList(search: string, gameCounts: string[], page: number) {
  const key = useMemo(
    () => buildPlayersKey(search, gameCounts[0] ?? "", page),
    [search, gameCounts, page]
  );

  const { data, isLoading, isValidating } = useSWR<PlayersResponse>(key, fetcher, {
    keepPreviousData: true,
  });

  return {
    players: data?.players ?? [],
    pagination: data?.pagination ?? null,
    loading: isValidating,
    initialLoading: isLoading && !data,
  };
}
