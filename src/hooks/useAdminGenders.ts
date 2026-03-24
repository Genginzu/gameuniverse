"use client";

import { useCallback, useEffect, useState } from "react";
import type { PaginationInfo } from "@/types/pagination";

export interface AdminGenderListItem {
  id: string;
  slug: string;
  characterCount: number;
  translations: { language_code: string; name: string }[];
}

export interface FetchGendersParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  locale?: string;
}

export interface UseAdminGendersReturn {
  genders: AdminGenderListItem[];
  pagination: PaginationInfo;
  loading: boolean;
  error: Error | null;
  fetchGenders: (params?: FetchGendersParams) => Promise<void>;
  deleteGender: (id: string) => Promise<void>;
  checkGenderUsage: (id: string) => Promise<number>;
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

export function useAdminGenders(): UseAdminGendersReturn {
  const [genders, setGenders] = useState<AdminGenderListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastParams, setLastParams] = useState<FetchGendersParams>({});

  const fetchGenders = useCallback(async (params: FetchGendersParams = {}) => {
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

      const response = await fetch(`/api/admin/genders?${searchParams.toString()}`);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch genders (${response.status})`);
      }

      const data = await response.json();

      setGenders(
        (data.genders ?? []).map((g: Record<string, unknown>) => ({
          id: g.id as string,
          slug: g.slug as string,
          characterCount: (g.characterCount as number) ?? 0,
          translations: (g.translations as { language_code: string; name: string }[]) ?? [],
        }))
      );
      setPagination(data.pagination ?? DEFAULT_PAGINATION);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteGender = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/admin/genders/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to delete gender (${response.status})`);
      }

      await fetchGenders(lastParams);
    },
    [fetchGenders, lastParams]
  );

  const checkGenderUsage = useCallback(async (id: string): Promise<number> => {
    const response = await fetch(`/api/admin/genders/${encodeURIComponent(id)}`);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Failed to check gender usage (${response.status})`);
    }

    const body = await response.json();
    return (body.gender?.characterCount as number) ?? 0;
  }, []);

  const refetch = useCallback(() => fetchGenders(lastParams), [fetchGenders, lastParams]);

  useEffect(() => {
    fetchGenders();
  }, [fetchGenders]);

  return {
    genders,
    pagination,
    loading,
    error,
    fetchGenders,
    deleteGender,
    checkGenderUsage,
    refetch,
  };
}
