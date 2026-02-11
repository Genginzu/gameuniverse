"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupportedLanguage, FetchLanguagesParams } from "@/types/admin-languages";
import type { PaginationInfo } from "@/types/pagination";

export type { SupportedLanguage, FetchLanguagesParams, PaginationInfo };

export interface UseAdminLanguagesReturn {
  languages: SupportedLanguage[];
  pagination: PaginationInfo;
  loading: boolean;
  error: Error | null;
  fetchLanguages: (params?: FetchLanguagesParams) => Promise<void>;
  deleteLanguage: (code: string) => Promise<void>;
  checkLanguageUsage: (code: string) => Promise<number>;
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

export function useAdminLanguages(): UseAdminLanguagesReturn {
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastParams, setLastParams] = useState<FetchLanguagesParams>({});

  const fetchLanguages = useCallback(async (params: FetchLanguagesParams = {}) => {
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

      const response = await fetch(`/api/admin/languages?${searchParams.toString()}`);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch languages (${response.status})`);
      }

      const data = await response.json();

      setLanguages(
        (data.languages ?? []).map((l: Record<string, unknown>) => ({
          code: l.code as string,
          name: l.name as string,
          native_name: (l.native_name as string) ?? null,
        }))
      );
      setPagination(data.pagination ?? DEFAULT_PAGINATION);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteLanguage = useCallback(
    async (code: string) => {
      const response = await fetch(`/api/admin/languages/${encodeURIComponent(code)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to delete language (${response.status})`);
      }

      // Refetch current page after deletion
      await fetchLanguages(lastParams);
    },
    [fetchLanguages, lastParams]
  );

  const checkLanguageUsage = useCallback(
    async (code: string): Promise<number> => {
      // Attempt a DELETE without force — if 409 is returned, the API provides usageCount
      const response = await fetch(`/api/admin/languages/${encodeURIComponent(code)}`, {
        method: "DELETE",
      });

      if (response.status === 409) {
        const body = await response.json().catch(() => ({}));
        return (body.usageCount as number) ?? 0;
      }

      // If the delete actually succeeded (language wasn't in use), that's unexpected
      // for a usage check — but we return 0 to indicate no usage
      if (response.ok) {
        // The language was deleted because it had no usage — refetch to reflect the change
        await fetchLanguages(lastParams);
        return 0;
      }

      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Failed to check language usage (${response.status})`);
    },
    [fetchLanguages, lastParams]
  );

  const refetch = useCallback(() => fetchLanguages(lastParams), [fetchLanguages, lastParams]);

  // Initial fetch
  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  return {
    languages,
    pagination,
    loading,
    error,
    fetchLanguages,
    deleteLanguage,
    checkLanguageUsage,
    refetch,
  };
}
