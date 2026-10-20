import type {
  ListingContext,
  ListingParamValue,
  ListingResource,
  ListingState,
} from "@/types/listing";

function serializeParam(value: ListingParamValue): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (Array.isArray(value)) return value.length > 0 ? value.join(",") : null;
  return String(value);
}

export function defaultListingState<TFilters extends object>(
  resource: ListingResource<TFilters>
): ListingState<TFilters> {
  return { filters: resource.defaultFilters, page: 1 };
}

export function buildListingUrl<TFilters extends object>(
  resource: ListingResource<TFilters>,
  state: ListingState<TFilters>,
  context: ListingContext
): string {
  const path = typeof resource.path === "function" ? resource.path(context) : resource.path;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(resource.toParams(state, context))) {
    const serialized = serializeParam(value);
    if (serialized !== null) search.set(key, serialized);
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export function buildDefaultListingUrl<TFilters extends object>(
  resource: ListingResource<TFilters>,
  context: ListingContext
): string {
  return buildListingUrl(resource, defaultListingState(resource), context);
}

export function resolveListingFallback<TFilters extends object, TData>(
  resource: ListingResource<TFilters>,
  state: ListingState<TFilters>,
  context: ListingContext,
  fallbackData: TData | undefined
): TData | undefined {
  if (fallbackData === undefined) return undefined;
  const isDefaultView =
    buildListingUrl(resource, state, context) === buildDefaultListingUrl(resource, context);
  return isDefaultView ? fallbackData : undefined;
}
