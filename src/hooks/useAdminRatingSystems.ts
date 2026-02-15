"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AdminRatingSystem,
  FetchRatingSystemsParams,
} from "@/types/admin-age-classifications";
import type { PaginationInfo } from "@/types/pagination";

export interface UseAdminRatingSystemsReturn {
  ratingSystems: AdminRatingSystem[];
  pagination: PaginationInfo;
  loading: boolean;
  error: Error | null;
  fetchRatingSystems: (params?: FetchRatingSystemsParams) => Promise<void>;
  deleteRatingSystem: (id: string) => Promise<void>;
  checkRatingSystemUsage: (id: string) => Promise<number>;
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

export function useAdminRatingSystems(): UseAdminRatingSystemsReturn {
  const [ratingSystems, setRatingSystems] = useState<AdminRatingSystem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastParams, setLastParams] = useState<FetchRatingSystemsParams>({});

  const fetchRatingSystems = useCallback(async (params: FetchRatingSystemsParams = {}) => {
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

      const response = await fetch(`/api/admin/age-classifications?${searchParams.toString()}`);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch rating systems (${response.status})`);
      }

      const data = await response.json();
      setRatingSystems(data.ratingSystems ?? []);
      setPagination(data.pagination ?? DEFAULT_PAGINATION);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRatingSystem = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/admin/age-classifications/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to delete rating system (${response.status})`);
      }

      await fetchRatingSystems(lastParams);
    },
    [fetchRatingSystems, lastParams]
  );

  const checkRatingSystemUsage = useCallback(
    async (id: string): Promise<number> => {
      const response = await fetch(`/api/admin/age-classifications/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (response.status === 409) {
        const body = await response.json().catch(() => ({}));
        return (body.usageCount as number) ?? 0;
      }

      // Delete succeeded — system had no usage
      if (response.ok) {
        await fetchRatingSystems(lastParams);
        return 0;
      }

      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Failed to check usage (${response.status})`);
    },
    [fetchRatingSystems, lastParams]
  );

  const refetch = useCallback(
    () => fetchRatingSystems(lastParams),
    [fetchRatingSystems, lastParams]
  );

  useEffect(() => {
    fetchRatingSystems();
  }, [fetchRatingSystems]);

  return {
    ratingSystems,
    pagination,
    loading,
    error,
    fetchRatingSystems,
    deleteRatingSystem,
    checkRatingSystemUsage,
    refetch,
  };
}
