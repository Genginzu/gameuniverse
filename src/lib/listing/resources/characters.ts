import type { ListingResource } from "@/types/listing";

export const CHARACTERS_PAGE_SIZE = 20;

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
