"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import type { AdminGame, FetchGamesParams } from "@/types/admin-games";
import type { PaginationInfo } from "@/types/pagination";

export type { AdminGame, FetchGamesParams, PaginationInfo };

export interface UseAdminGamesReturn {
  games: AdminGame[];
  pagination: PaginationInfo;
  loading: boolean;
  error: Error | null;
  fetchGames: (params?: FetchGamesParams) => Promise<void>;
  deleteGame: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const DEFAULT_PAGINATION: PaginationInfo = {
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  limit: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function useAdminGames(): UseAdminGamesReturn {
  const [games, setGames] = useState<AdminGame[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastParams, setLastParams] = useState<FetchGamesParams>({});
  const locale = useLocale();

  const fetchGames = useCallback(
    async (params: FetchGamesParams = {}) => {
      setLoading(true);
      setError(null);
      setLastParams(params);

      try {
        const searchParams = new URLSearchParams();
        searchParams.set("page", String(params.page ?? 1));
        searchParams.set("limit", String(params.limit ?? 20));
        searchParams.set("locale", locale);

        if (params.search?.trim()) {
          searchParams.set("search", params.search.trim());
        }
        if (params.sortBy) {
          searchParams.set("sort_by", params.sortBy);
        }
        if (params.sortOrder) {
          searchParams.set("sort_order", params.sortOrder);
        }

        const response = await fetch(`/api/admin/games?${searchParams.toString()}`);

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || `Failed to fetch games (${response.status})`);
        }

        const data = await response.json();

        setGames(
          (data.games ?? []).map((g: Record<string, unknown>) => ({
            id: g.id as string,
            slug: g.slug as string,
            title: g.title as string,
            coverImage: (g.coverImage as string) ?? null,
            releaseDate: (g.releaseDate as string) ?? null,
            updatedAt: g.updatedAt as string,
          }))
        );
        setPagination(data.pagination ?? DEFAULT_PAGINATION);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    },
    [locale]
  );

  const deleteGame = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/admin/games/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to delete game (${response.status})`);
      }

      // Refetch current page after deletion
      await fetchGames(lastParams);
    },
    [fetchGames, lastParams]
  );

  const refetch = useCallback(() => fetchGames(lastParams), [fetchGames, lastParams]);

  // Initial fetch
  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return { games, pagination, loading, error, fetchGames, deleteGame, refetch };
}
