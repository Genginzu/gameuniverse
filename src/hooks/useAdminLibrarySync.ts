"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { fetcher } from "@/lib/swr/fetcher";

export interface PlatformMatch {
  platform: string;
  sourceId: string;
  name: string | null;
  gameId: string | null;
  gameTitle: string | null;
  gameSlug: string | null;
  updatedAt: string;
}

interface MatchesResponse {
  matches: PlatformMatch[];
  total: number;
  page: number;
  pageSize: number;
}

export type MatchStatus = "unmatched" | "matched" | "all";

interface UseAdminLibrarySyncParams {
  platform: string; // "" = all
  status: MatchStatus;
  search: string;
  page: number;
  locale: string;
}

/** Admin management of the shared platform → game match cache. */
export function useAdminLibrarySync(params: UseAdminLibrarySyncParams) {
  const query = new URLSearchParams({
    status: params.status,
    page: String(params.page),
    locale: params.locale,
  });
  if (params.platform) query.set("platform", params.platform);
  if (params.search.trim()) query.set("search", params.search.trim());

  const key = `/api/admin/library-sync/matches?${query.toString()}`;
  const { data, isLoading, mutate } = useSWR<MatchesResponse>(key, fetcher);

  const linkMatch = useCallback(
    async (platform: string, sourceId: string, gameId: string | null) => {
      const res = await fetch("/api/admin/library-sync/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, sourceId, gameId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update match");
      }
      await mutate();
    },
    [mutate]
  );

  return {
    matches: data?.matches ?? [],
    total: data?.total ?? 0,
    pageSize: data?.pageSize ?? 25,
    isLoading,
    linkMatch,
    refresh: mutate,
  };
}
