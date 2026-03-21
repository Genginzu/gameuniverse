"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminRole, FetchRolesParams } from "@/types/admin-roles";
import type { PaginationInfo } from "@/types/pagination";

export type { AdminRole, FetchRolesParams, PaginationInfo };

export interface UseAdminRolesReturn {
  roles: AdminRole[];
  pagination: PaginationInfo;
  loading: boolean;
  error: Error | null;
  fetchRoles: (params?: FetchRolesParams) => Promise<void>;
  deleteRole: (slug: string) => Promise<void>;
  checkRoleUsage: (slug: string) => Promise<number>;
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

export function useAdminRoles(): UseAdminRolesReturn {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastParams, setLastParams] = useState<FetchRolesParams>({});

  const fetchRoles = useCallback(async (params: FetchRolesParams = {}) => {
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
      if (params.locale) searchParams.set("locale", params.locale);

      const response = await fetch(`/api/admin/roles?${searchParams.toString()}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch roles (${response.status})`);
      }

      const data = await response.json();
      setRoles(
        (data.roles ?? []).map((r: Record<string, unknown>) => ({
          id: r.id as string,
          slug: r.slug as string,
          characterCount: (r.characterCount as number) ?? 0,
          translations: (r.translations as AdminRole["translations"]) ?? [],
        }))
      );
      setPagination(data.pagination ?? DEFAULT_PAGINATION);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRole = useCallback(
    async (slug: string) => {
      const response = await fetch(`/api/admin/roles/${encodeURIComponent(slug)}?force=true`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to delete role (${response.status})`);
      }
      await fetchRoles(lastParams);
    },
    [fetchRoles, lastParams]
  );

  const checkRoleUsage = useCallback(
    async (slug: string): Promise<number> => {
      const response = await fetch(`/api/admin/roles/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      if (response.status === 409) {
        const body = await response.json().catch(() => ({}));
        return (body.usageCount as number) ?? 0;
      }
      if (response.ok) {
        await fetchRoles(lastParams);
        return 0;
      }
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Failed to check role usage (${response.status})`);
    },
    [fetchRoles, lastParams]
  );

  const refetch = useCallback(() => fetchRoles(lastParams), [fetchRoles, lastParams]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return { roles, pagination, loading, error, fetchRoles, deleteRole, checkRoleUsage, refetch };
}
