import type { ListingResource } from "@/types/listing";

export const tagPostsListing: ListingResource<Record<string, never>> = {
  path: ({ pathParams }) => `/api/posts/tags/${encodeURIComponent(pathParams?.tag ?? "")}`,
  revalidate: 60,
  defaultFilters: {},
  toParams: ({ page }) => ({ page }),
};
