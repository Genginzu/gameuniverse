"use client";

import { useCallback, useReducer } from "react";
import useSWR from "swr";

import { fetcher } from "@/lib/swr/fetcher";
import { reduceListingState, scrollToTop } from "@/lib/listing/state";
import { buildListingUrl, defaultListingState, resolveListingFallback } from "@/lib/listing/url";
import type { ListingAction, ListingResource, ListingState } from "@/types/listing";

interface UseListingQueryOptions<TData> {
  locale?: string;
  pathParams?: Record<string, string>;
  fallbackData?: TData;
}

export function useListingQuery<TFilters extends object, TData>(
  resource: ListingResource<TFilters>,
  { locale = "", pathParams, fallbackData }: UseListingQueryOptions<TData> = {}
) {
  const [state, dispatch] = useReducer(
    (current: ListingState<TFilters>, action: ListingAction<TFilters>) =>
      reduceListingState(current, action, resource.defaultFilters),
    resource,
    defaultListingState
  );

  const context = { locale, pathParams };
  const key = buildListingUrl(resource, state, context);

  const { data, error, isLoading, isValidating, mutate } = useSWR<TData>(key, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
    ...resource.swr,
    fallbackData: resolveListingFallback(resource, state, context, fallbackData),
  });

  const setFilters = useCallback(
    (patch: Partial<TFilters>) => dispatch({ type: "setFilters", patch }),
    []
  );
  const resetFilters = useCallback(() => dispatch({ type: "resetFilters" }), []);
  const setPage = useCallback((page: number) => {
    scrollToTop();
    dispatch({ type: "setPage", page });
  }, []);

  return {
    filters: state.filters,
    page: state.page,
    setFilters,
    resetFilters,
    setPage,
    data,
    error: error as Error | undefined,
    isLoading,
    isValidating,
    mutate,
  };
}
