import { DEFAULT_GAME_LISTING_SORT, type GameListingSort } from "@/types/game";
import type { ListingResource } from "@/types/listing";

export const GAMES_PAGE_SIZE = 20;
export const TRENDING_SECTION_SIZE = 12;
export const UPCOMING_PAGE_SIZE = 24;

export interface GamesListingFilters {
  genres: string[];
  platforms: string[];
  sort: GameListingSort;
  esport: boolean | null;
}

export const gamesListing: ListingResource<GamesListingFilters> = {
  path: "/api/games",
  revalidate: 300,
  defaultFilters: { genres: [], platforms: [], sort: DEFAULT_GAME_LISTING_SORT, esport: null },
  toParams: ({ filters, page }, { locale }) => ({
    locale,
    page,
    limit: GAMES_PAGE_SIZE,
    fields: "description",
    genres: filters.genres,
    platforms: filters.platforms,
    sort: filters.sort === DEFAULT_GAME_LISTING_SORT ? undefined : filters.sort,
    esport: filters.esport,
  }),
};

export const trendingListing: ListingResource<Record<string, never>> = {
  path: "/api/games/trending",
  revalidate: 300,
  defaultFilters: {},
  toParams: (_state, { locale }) => ({ locale, limit: TRENDING_SECTION_SIZE }),
  swr: { dedupingInterval: 60_000 },
};

export const upcomingListing: ListingResource<{ month: string }> = {
  path: "/api/games/upcoming",
  revalidate: 300,
  defaultFilters: { month: "" },
  toParams: ({ filters, page }, { locale }) => ({
    locale,
    page,
    limit: UPCOMING_PAGE_SIZE,
    month: filters.month,
  }),
  swr: { dedupingInterval: 60_000 },
};
