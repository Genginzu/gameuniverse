import type { SWRConfiguration } from "swr";

export type ListingParamValue = string | number | boolean | null | undefined | readonly string[];

export type ListingParams = Record<string, ListingParamValue>;

export interface ListingContext {
  locale: string;
  pathParams?: Record<string, string>;
}

export interface ListingState<TFilters extends object> {
  filters: TFilters;
  page: number;
}

export type ListingAction<TFilters extends object> =
  | { type: "setFilters"; patch: Partial<TFilters> }
  | { type: "resetFilters" }
  | { type: "setPage"; page: number };

export interface ListingResource<TFilters extends object> {
  path: string | ((context: ListingContext) => string);
  defaultFilters: TFilters;
  toParams(state: ListingState<TFilters>, context: ListingContext): ListingParams;
  revalidate: number;
  swr?: Pick<SWRConfiguration, "refreshInterval" | "dedupingInterval">;
}
