import { logger } from "@/lib/logger";
import type { ListingContext, ListingResource } from "@/types/listing";
import { buildDefaultListingUrl } from "./url";

export async function fetchInternalApi<TData>(
  path: string,
  revalidate: number
): Promise<TData | undefined> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}${path}`, { next: { revalidate } });
    if (!res.ok) {
      logger.warn("Internal API responded with an error status server-side", {
        path,
        status: res.status,
      });
      return undefined;
    }
    return (await res.json()) as TData;
  } catch (error) {
    logger.error("Failed to fetch internal API server-side", { path, error });
    return undefined;
  }
}

export function fetchListingDefault<TData, TFilters extends object = object>(
  resource: ListingResource<TFilters>,
  context: ListingContext
): Promise<TData | undefined> {
  return fetchInternalApi<TData>(buildDefaultListingUrl(resource, context), resource.revalidate);
}
