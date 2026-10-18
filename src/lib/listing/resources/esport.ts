import type { ListingResource } from "@/types/listing";

const ESPORT_REVALIDATE = 3600;

export interface EsportGameFilter {
  game: string | null;
}

function gameFilteredListing(path: string): ListingResource<EsportGameFilter> {
  return {
    path,
    revalidate: ESPORT_REVALIDATE,
    defaultFilters: { game: null },
    toParams: ({ filters }) => ({ game: filters.game }),
  };
}

export const esportLiveListing: ListingResource<EsportGameFilter> = {
  ...gameFilteredListing("/api/esport/live"),
  swr: { refreshInterval: 120_000 },
};

export const esportResultsListing = gameFilteredListing("/api/esport/results");

export const esportTournamentsListing = gameFilteredListing("/api/esport/tournaments");

export const esportTeamsListing: ListingResource<{ search: string }> = {
  path: "/api/esport/teams",
  revalidate: ESPORT_REVALIDATE,
  defaultFilters: { search: "" },
  toParams: ({ filters }) => ({ search: filters.search }),
};

export const esportPlayersListing: ListingResource<{ search: string; game: string | null }> = {
  path: "/api/esport/players",
  revalidate: ESPORT_REVALIDATE,
  defaultFilters: { search: "", game: null },
  toParams: ({ filters, page }) => ({
    search: filters.search,
    game: filters.game,
    page: page > 1 ? page : undefined,
  }),
};

export type EsportGameOptionsSource = "tournaments" | "players";

export function esportGameOptionsUrl(source: EsportGameOptionsSource): string {
  return `/api/esport/${source}?games_only=true`;
}
