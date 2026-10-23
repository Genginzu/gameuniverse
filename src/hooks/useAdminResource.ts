"use client";

import { useCallback, useMemo } from "react";
import { useLocale } from "next-intl";

import { useListingQuery } from "@/hooks/useListingQuery";
import { adminItemUrl, readApiError } from "@/lib/admin-resource/defineAdminResource";
import type { AdminRawRow, AdminResource, AdminSort } from "@/types/admin-resource";
import type { PaginationInfo } from "@/types/pagination";

const EMPTY_PAGINATION: PaginationInfo = {
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  limit: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

type ListResponse = Record<string, unknown> & { pagination?: PaginationInfo };

interface UseAdminResourceOptions {
  pathParams?: Record<string, string>;
}

export function useAdminResource<TRow>(
  resource: AdminResource<TRow>,
  { pathParams = {} }: UseAdminResourceOptions = {}
) {
  const locale = useLocale();
  const pathKey = JSON.stringify(pathParams);
  const stablePathParams = useMemo(() => JSON.parse(pathKey) as Record<string, string>, [pathKey]);
  const listing = useListingQuery<typeof resource.listing.defaultFilters, ListResponse>(
    resource.listing,
    { locale, pathParams: stablePathParams }
  );
  const { data, mutate, setFilters } = listing;

  const rows = useMemo(
    () => ((data?.[resource.listKey] as AdminRawRow[] | undefined) ?? []).map(resource.mapRow),
    [data, resource]
  );

  const setSearch = useCallback((search: string) => setFilters({ search }), [setFilters]);
  const setSort = useCallback(
    (sort: AdminSort) => setFilters({ sortBy: sort.field, sortOrder: sort.order }),
    [setFilters]
  );

  const remove = useCallback(
    async (row: TRow) => {
      const query = resource.forceDelete ? "?force=true" : "";
      const response = await fetch(adminItemUrl(resource, stablePathParams, row, query), {
        method: "DELETE",
      });
      if (!response.ok) throw await readApiError(response, "Failed to delete");
      await mutate();
    },
    [resource, stablePathParams, mutate]
  );

  const checkUsage = useCallback(
    async (row: TRow): Promise<number | undefined> => {
      if (!resource.usage) return undefined;
      const response = await fetch(adminItemUrl(resource, stablePathParams, row, "/usage"));
      if (!response.ok) throw await readApiError(response, "Failed to read usage");
      const body = await response.json();
      return (body.usageCount as number) ?? 0;
    },
    [resource, stablePathParams]
  );

  const revalidate = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return {
    rows,
    pagination: data?.pagination ?? EMPTY_PAGINATION,
    isLoading: listing.isLoading,
    error: listing.error,
    search: listing.filters.search,
    sort: { field: listing.filters.sortBy, order: listing.filters.sortOrder } as AdminSort,
    setSearch,
    setSort,
    setPage: listing.setPage,
    remove,
    checkUsage,
    revalidate,
  };
}

export type AdminResourceList<TRow> = ReturnType<typeof useAdminResource<TRow>>;
