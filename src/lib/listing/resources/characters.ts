import type { ListingResource } from "@/types/listing";

// 24 = least common multiple of the character grid columns (2, 3, 4, 6):
// every full page fills its last row whatever the screen width.
export const CHARACTERS_PAGE_SIZE = 24;

export interface CharactersListingFilters {
  roles: string[];
  platforms: string[];
}

export const charactersListing: ListingResource<CharactersListingFilters> = {
  path: "/api/characters",
  revalidate: 300,
  defaultFilters: { roles: [], platforms: [] },
  toParams: ({ filters, page }, { locale }) => ({
    locale,
    page,
    limit: CHARACTERS_PAGE_SIZE,
    roles: filters.roles,
    platforms: filters.platforms,
  }),
};
