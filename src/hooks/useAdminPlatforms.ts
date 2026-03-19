"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminPlatform, FetchPlatformsParams } from "@/types/admin-platforms";
import type { PaginationInfo } from "@/types/pagination";

export interface UseAdminPlatformsReturn {
  platforms: AdminPlatform[];
  pagination: PaginationInfo;
  loading: boolean;
  error: Error | null;
  fetchPlatforms: (params?: FetchPlatformsParams) => Promise<void>;
  deletePlatform: (slug: string) => Promise<void>;
  checkPlatformUsage: (slug: string) => Promise<number>;
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

export function useAdminPlatforms(): UseAdminPlatformsReturn {
  const [platforms, setPlatforms] = useState<AdminPlatform[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastParams, setLastParams] = useState<FetchPlatformsParams>({});

  const fetchPlatforms = useCallback(async (params: FetchPlatformsParams = {}) => {
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

      const response = await fetch(`/api/admin/platforms?${searchParams.toString()}`);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch platforms (${response.status})`);
      }

      const data = await response.json();

      setPlatforms(
        (data.platforms ?? []).map((p: Record<string, unknown>) => ({
          id: p.id as string,
          slug: p.slug as string,
          iconUrl: (p.iconUrl as string) || undefined,
          gameCount: (p.gameCount as number) ?? 0,
          translations: (p.translations as AdminPlatform["translations"]) ?? [],
        }))
      );
      setPagination(data.pagination ?? DEFAULT_PAGINATION);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePlatform = useCallback(
    async (slug: string) => {
      const response = await fetch(`/api/admin/platforms/${encodeURIComponent(slug)}?force=true`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to delete platform (${response.status})`);
      }

      await fetchPlatforms(lastParams);
    },
    [fetchPlatforms, lastParams]
  );

  const checkPlatformUsage = useCallback(
    async (slug: string): Promise<number> => {
      const response = await fetch(`/api/admin/platforms/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });

      if (response.status === 409) {
        const body = await response.json().catch(() => ({}));
        return (body.usageCount as number) ?? 0;
      }

      if (response.ok) {
        // Platform was deleted (0 usage) — refetch list
        await fetchPlatforms(lastParams);
        return 0;
      }

      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Failed to check platform usage (${response.status})`);
    },
    [fetchPlatforms, lastParams]
  );

  const refetch = useCallback(() => fetchPlatforms(lastParams), [fetchPlatforms, lastParams]);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  return {
    platforms,
    pagination,
    loading,
    error,
    fetchPlatforms,
    deletePlatform,
    checkPlatformUsage,
    refetch,
  };
}
