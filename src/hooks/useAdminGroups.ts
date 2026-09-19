"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminGroup, FetchAdminGroupsParams } from "@/types/admin-groups";
import type { PaginationInfo } from "@/types/pagination";

export interface UseAdminGroupsReturn {
  groups: AdminGroup[];
  pagination: PaginationInfo;
  loading: boolean;
  error: Error | null;
  fetchGroups: (params?: FetchAdminGroupsParams) => Promise<void>;
  setVisibility: (id: string, visibility: "public" | "private") => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
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

export function useAdminGroups(): UseAdminGroupsReturn {
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastParams, setLastParams] = useState<FetchAdminGroupsParams>({});

  const fetchGroups = useCallback(async (params: FetchAdminGroupsParams = {}) => {
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

      const response = await fetch(`/api/admin/groups?${searchParams.toString()}`);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch groups (${response.status})`);
      }

      const data = await response.json();
      setGroups(data.groups ?? []);
      setPagination(data.pagination ?? DEFAULT_PAGINATION);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  const setVisibility = useCallback(
    async (id: string, visibility: "public" | "private") => {
      const response = await fetch(`/api/admin/groups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to update group (${response.status})`);
      }

      await fetchGroups(lastParams);
    },
    [fetchGroups, lastParams]
  );

  const deleteGroup = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/admin/groups/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to delete group (${response.status})`);
      }

      await fetchGroups(lastParams);
    },
    [fetchGroups, lastParams]
  );

  const refetch = useCallback(() => fetchGroups(lastParams), [fetchGroups, lastParams]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return { groups, pagination, loading, error, fetchGroups, setVisibility, deleteGroup, refetch };
}
