"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminAchievement, FetchAchievementsParams } from "@/types/admin-achievements";
import type { PaginationInfo } from "@/types/pagination";

export type { AdminAchievement, FetchAchievementsParams, PaginationInfo };

export interface UseAdminAchievementsReturn {
  achievements: AdminAchievement[];
  pagination: PaginationInfo;
  loading: boolean;
  error: Error | null;
  fetchAchievements: (params?: FetchAchievementsParams) => Promise<void>;
  deleteAchievement: (id: string) => Promise<void>;
  checkUsage: (id: string) => Promise<number>;
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

export function useAdminAchievements(): UseAdminAchievementsReturn {
  const [achievements, setAchievements] = useState<AdminAchievement[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastParams, setLastParams] = useState<FetchAchievementsParams>({});

  const fetchAchievements = useCallback(async (params: FetchAchievementsParams = {}) => {
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

      const response = await fetch(`/api/admin/achievements?${searchParams.toString()}`);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch achievements (${response.status})`);
      }

      const data = await response.json();

      setAchievements(data.achievements ?? []);
      setPagination(data.pagination ?? DEFAULT_PAGINATION);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAchievement = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/admin/achievements/${encodeURIComponent(id)}?force=true`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to delete achievement (${response.status})`);
      }

      await fetchAchievements(lastParams);
    },
    [fetchAchievements, lastParams]
  );

  const checkUsage = useCallback(async (id: string): Promise<number> => {
    const response = await fetch(`/api/admin/achievements/${encodeURIComponent(id)}/usage`);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Failed to check usage (${response.status})`);
    }

    const body = await response.json();
    return (body.usageCount as number) ?? 0;
  }, []);

  const refetch = useCallback(() => fetchAchievements(lastParams), [fetchAchievements, lastParams]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  return {
    achievements,
    pagination,
    loading,
    error,
    fetchAchievements,
    deleteAchievement,
    checkUsage,
    refetch,
  };
}
