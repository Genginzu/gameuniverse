import type { ListingResource } from "@/types/listing";

export const FRANCHISES_PAGE_SIZE = 24;

export const franchisesListing: ListingResource<{ search: string }> = {
  path: "/api/franchises",
  revalidate: 300,
  defaultFilters: { search: "" },
  toParams: ({ filters, page }) => ({
    page,
    limit: FRANCHISES_PAGE_SIZE,
    search: filters.search.trim(),
  }),
};
