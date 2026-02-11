"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import type { AdminCharacter, FetchCharactersParams } from "@/types/admin-characters";
import type { PaginationInfo } from "@/types/pagination";

export type { AdminCharacter, FetchCharactersParams, PaginationInfo };

export interface UseAdminCharactersReturn {
  characters: AdminCharacter[];
  pagination: PaginationInfo;
  loading: boolean;
  error: Error | null;
  fetchCharacters: (params?: FetchCharactersParams) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
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

export function useAdminCharacters(): UseAdminCharactersReturn {
  const [characters, setCharacters] = useState<AdminCharacter[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastParams, setLastParams] = useState<FetchCharactersParams>({});
  const locale = useLocale();

  const fetchCharacters = useCallback(
    async (params: FetchCharactersParams = {}) => {
      setLoading(true);
      setError(null);
      setLastParams(params);

      try {
        const searchParams = new URLSearchParams();
        searchParams.set("page", String(params.page ?? 1));
        searchParams.set("limit", String(params.limit ?? 20));
        searchParams.set("locale", locale);

        if (params.search?.trim()) {
          searchParams.set("search", params.search.trim());
        }
        if (params.sortBy) {
          searchParams.set("sort_by", params.sortBy);
        }
        if (params.sortOrder) {
          searchParams.set("sort_order", params.sortOrder);
        }

        const response = await fetch(`/api/admin/characters?${searchParams.toString()}`);

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || `Failed to fetch characters (${response.status})`);
        }

        const data = await response.json();

        setCharacters(
          (data.characters ?? []).map((c: Record<string, unknown>) => ({
            id: c.id as string,
            slug: c.slug as string,
            name: c.name as string,
            role: (c.role as string) ?? null,
            mainImage: (c.mainImage as string) ?? null,
            primaryGame: (c.primaryGame as string) ?? "",
            updatedAt: c.updatedAt as string,
          }))
        );
        setPagination(data.pagination ?? DEFAULT_PAGINATION);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    },
    [locale]
  );

  const deleteCharacter = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/admin/characters/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to delete character (${response.status})`);
      }

      // Refetch current page after deletion
      await fetchCharacters(lastParams);
    },
    [fetchCharacters, lastParams]
  );

  const refetch = useCallback(() => fetchCharacters(lastParams), [fetchCharacters, lastParams]);

  // Initial fetch
  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  return { characters, pagination, loading, error, fetchCharacters, deleteCharacter, refetch };
}
