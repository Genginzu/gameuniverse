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
  /** IGDB metadata slugs (deep-linkable from the game page). */
  themes: string[];
  gameModes: string[];
  perspectives: string[];
  engines: string[];
  franchises: string[];
}

/** Filters of the games listing read from (and linkable through) the page URL. */
export const GAMES_URL_FILTER_KEYS = [
  "genres",
  "platforms",
  "themes",
  "gameModes",
  "perspectives",
  "engines",
  "franchises",
] as const satisfies ReadonlyArray<keyof GamesListingFilters>;

export const gamesListing: ListingResource<GamesListingFilters> = {
  path: "/api/games",
  revalidate: 300,
  defaultFilters: {
    genres: [],
    platforms: [],
    sort: DEFAULT_GAME_LISTING_SORT,
    esport: null,
    themes: [],
    gameModes: [],
    perspectives: [],
    engines: [],
    franchises: [],
  },
  toParams: ({ filters, page }, { locale }) => ({
    locale,
    page,
    limit: GAMES_PAGE_SIZE,
    fields: "description",
    genres: filters.genres,
    platforms: filters.platforms,
    sort: filters.sort === DEFAULT_GAME_LISTING_SORT ? undefined : filters.sort,
    esport: filters.esport,
    themes: filters.themes,
    gameModes: filters.gameModes,
    perspectives: filters.perspectives,
    engines: filters.engines,
    franchises: filters.franchises,
  }),
};

/** Array filters present in a games page URL (`/games?themes=open-world`), or null when none. */
export function gamesFiltersFromSearchParams(
  searchParams: URLSearchParams
): Partial<GamesListingFilters> | null {
  const patch: Partial<GamesListingFilters> = {};
  for (const key of GAMES_URL_FILTER_KEYS) {
    const values = (searchParams.get(key) ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (values.length > 0) patch[key] = values;
  }
  return Object.keys(patch).length > 0 ? patch : null;
}

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
