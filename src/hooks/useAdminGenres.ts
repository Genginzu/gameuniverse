"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminGenre, FetchGenresParams } from "@/types/admin-genres";
import type { PaginationInfo } from "@/types/pagination";

export type { AdminGenre, FetchGenresParams, PaginationInfo };

export interface UseAdminGenresReturn {
  genres: AdminGenre[];
  pagination: PaginationInfo;
  loading: boolean;
  error: Error | null;
  fetchGenres: (params?: FetchGenresParams) => Promise<void>;
  deleteGenre: (slug: string) => Promise<void>;
  checkGenreUsage: (slug: string) => Promise<number>;
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

export function useAdminGenres(): UseAdminGenresReturn {
  const [genres, setGenres] = useState<AdminGenre[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastParams, setLastParams] = useState<FetchGenresParams>({});

  const fetchGenres = useCallback(async (params: FetchGenresParams = {}) => {
    setLoading(true);
    setError(null);
    setLastParams(params);

    try {
      const searchParams = new URLSearchParams();
      searchParams.set("page", String(params.page ?? 1));
      searchParams.set("limit", String(params.limit ?? 20));

      if (params.search?.trim()) {
        searchParams.set("search", params.search.trim());
      }
      if (params.sortBy) {
        searchParams.set("sort_by", params.sortBy);
      }
      if (params.sortOrder) {
        searchParams.set("sort_order", params.sortOrder);
      }
      if (params.locale) {
        searchParams.set("locale", params.locale);
      }

      const response = await fetch(`/api/admin/genres?${searchParams.toString()}`);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch genres (${response.status})`);
      }

      const data = await response.json();

      setGenres(
        (data.genres ?? []).map((g: Record<string, unknown>) => ({
          id: g.id as string,
          slug: g.slug as string,
          gameCount: (g.gameCount as number) ?? 0,
          translations: (g.translations as AdminGenre["translations"]) ?? [],
        }))
      );
      setPagination(data.pagination ?? DEFAULT_PAGINATION);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteGenre = useCallback(
    async (slug: string) => {
      const response = await fetch(`/api/admin/genres/${encodeURIComponent(slug)}?force=true`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to delete genre (${response.status})`);
      }

      await fetchGenres(lastParams);
    },
    [fetchGenres, lastParams]
  );

  const checkGenreUsage = useCallback(
    async (slug: string): Promise<number> => {
      const response = await fetch(`/api/admin/genres/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });

      if (response.status === 409) {
        const body = await response.json().catch(() => ({}));
        return (body.usageCount as number) ?? 0;
      }

      if (response.ok) {
        await fetchGenres(lastParams);
        return 0;
      }

      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Failed to check genre usage (${response.status})`);
    },
    [fetchGenres, lastParams]
  );

  const refetch = useCallback(() => fetchGenres(lastParams), [fetchGenres, lastParams]);

  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

  return {
    genres,
    pagination,
    loading,
    error,
    fetchGenres,
    deleteGenre,
    checkGenreUsage,
    refetch,
  };
}
