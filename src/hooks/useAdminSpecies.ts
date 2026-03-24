"use client";

import { useCallback, useEffect, useState } from "react";
import type { PaginationInfo } from "@/types/pagination";

export interface AdminSpeciesListItem {
  id: string;
  slug: string;
  characterCount: number;
  translations: { language_code: string; name: string }[];
}

export interface FetchSpeciesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  locale?: string;
}

export interface UseAdminSpeciesReturn {
  species: AdminSpeciesListItem[];
  pagination: PaginationInfo;
  loading: boolean;
  error: Error | null;
  fetchSpecies: (params?: FetchSpeciesParams) => Promise<void>;
  deleteSpecies: (id: string) => Promise<void>;
  checkSpeciesUsage: (id: string) => Promise<number>;
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

export function useAdminSpecies(): UseAdminSpeciesReturn {
  const [species, setSpecies] = useState<AdminSpeciesListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastParams, setLastParams] = useState<FetchSpeciesParams>({});

  const fetchSpecies = useCallback(async (params: FetchSpeciesParams = {}) => {
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

      const response = await fetch(`/api/admin/species?${searchParams.toString()}`);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch species (${response.status})`);
      }

      const data = await response.json();

      setSpecies(
        (data.species ?? []).map((s: Record<string, unknown>) => ({
          id: s.id as string,
          slug: s.slug as string,
          characterCount: (s.characterCount as number) ?? 0,
          translations: (s.translations as { language_code: string; name: string }[]) ?? [],
        }))
      );
      setPagination(data.pagination ?? DEFAULT_PAGINATION);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSpecies = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/admin/species/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to delete species (${response.status})`);
      }

      await fetchSpecies(lastParams);
    },
    [fetchSpecies, lastParams]
  );

  const checkSpeciesUsage = useCallback(async (id: string): Promise<number> => {
    const response = await fetch(`/api/admin/species/${encodeURIComponent(id)}`);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Failed to check species usage (${response.status})`);
    }

    const body = await response.json();
    return (body.species?.characterCount as number) ?? 0;
  }, []);

  const refetch = useCallback(() => fetchSpecies(lastParams), [fetchSpecies, lastParams]);

  useEffect(() => {
    fetchSpecies();
  }, [fetchSpecies]);

  return {
    species,
    pagination,
    loading,
    error,
    fetchSpecies,
    deleteSpecies,
    checkSpeciesUsage,
    refetch,
  };
}
