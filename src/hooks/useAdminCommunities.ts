"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminCommunity, FetchAdminCommunitiesParams } from "@/types/admin-communities";
import type { PaginationInfo } from "@/types/pagination";

export interface UseAdminCommunitiesReturn {
  communities: AdminCommunity[];
  pagination: PaginationInfo;
  loading: boolean;
  error: Error | null;
  fetchCommunities: (params?: FetchAdminCommunitiesParams) => Promise<void>;
  setVisibility: (id: string, visibility: "public" | "private") => Promise<void>;
  deleteCommunity: (id: string) => Promise<void>;
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

export function useAdminCommunities(): UseAdminCommunitiesReturn {
  const [communities, setCommunities] = useState<AdminCommunity[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastParams, setLastParams] = useState<FetchAdminCommunitiesParams>({});

  const fetchCommunities = useCallback(async (params: FetchAdminCommunitiesParams = {}) => {
    setLoading(true);
    setError(null);
    setLastParams(params);

    try {
      const searchParams = new URLSearchParams();
      searchParams.set("page", String(params.page ?? 1));
      searchParams.set("limit", String(params.limit ?? 20));

      if (params.search?.trim()) searchParams.set("search", params.search.trim());
      if (params.sortBy) searchParams.set("sort_by", params.sortBy);
      if (params.sortOrder) searchParams.set("sort_order", params.sortOrder);

      const response = await fetch(`/api/admin/communities?${searchParams.toString()}`);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch communities (${response.status})`);
      }

      const data = await response.json();
      setCommunities(data.communities ?? []);
      setPagination(data.pagination ?? DEFAULT_PAGINATION);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  const setVisibility = useCallback(
    async (id: string, visibility: "public" | "private") => {
      const response = await fetch(`/api/admin/communities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to update community (${response.status})`);
      }

      await fetchCommunities(lastParams);
    },
    [fetchCommunities, lastParams]
  );

  const deleteCommunity = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/admin/communities/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to delete community (${response.status})`);
      }

      await fetchCommunities(lastParams);
    },
    [fetchCommunities, lastParams]
  );

  const refetch = useCallback(() => fetchCommunities(lastParams), [fetchCommunities, lastParams]);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  return {
    communities,
    pagination,
    loading,
    error,
    fetchCommunities,
    setVisibility,
    deleteCommunity,
    refetch,
  };
}
