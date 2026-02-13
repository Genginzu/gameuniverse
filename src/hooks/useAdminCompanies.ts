"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminCompany, FetchCompaniesParams } from "@/types/admin-companies";
import type { PaginationInfo } from "@/types/pagination";

export type { AdminCompany, FetchCompaniesParams, PaginationInfo };

export interface UseAdminCompaniesReturn {
  companies: AdminCompany[];
  pagination: PaginationInfo;
  loading: boolean;
  error: Error | null;
  fetchCompanies: (params?: FetchCompaniesParams) => Promise<void>;
  deleteCompany: (slug: string) => Promise<void>;
  checkCompanyUsage: (slug: string) => Promise<number>;
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

export function useAdminCompanies(): UseAdminCompaniesReturn {
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastParams, setLastParams] = useState<FetchCompaniesParams>({});

  const fetchCompanies = useCallback(async (params: FetchCompaniesParams = {}) => {
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

      const response = await fetch(`/api/admin/companies?${searchParams.toString()}`);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch companies (${response.status})`);
      }

      const data = await response.json();

      setCompanies(data.companies ?? []);
      setPagination(data.pagination ?? DEFAULT_PAGINATION);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCompany = useCallback(
    async (slug: string) => {
      const response = await fetch(`/api/admin/companies/${encodeURIComponent(slug)}?force=true`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to delete company (${response.status})`);
      }

      await fetchCompanies(lastParams);
    },
    [fetchCompanies, lastParams]
  );

  const checkCompanyUsage = useCallback(
    async (slug: string): Promise<number> => {
      const response = await fetch(`/api/admin/companies/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });

      if (response.status === 409) {
        const body = await response.json().catch(() => ({}));
        return (body.usageCount as number) ?? 0;
      }

      if (response.ok) {
        await fetchCompanies(lastParams);
        return 0;
      }

      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Failed to check company usage (${response.status})`);
    },
    [fetchCompanies, lastParams]
  );

  const refetch = useCallback(() => fetchCompanies(lastParams), [fetchCompanies, lastParams]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return {
    companies,
    pagination,
    loading,
    error,
    fetchCompanies,
    deleteCompany,
    checkCompanyUsage,
    refetch,
  };
}
