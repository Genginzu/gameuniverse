import { describe, it, expect } from "vitest";

import { charactersListing } from "@/lib/listing/resources/characters";
import {
  esportLiveListing,
  esportPlayersListing,
  esportResultsListing,
  esportTeamsListing,
  esportTournamentsListing,
} from "@/lib/listing/resources/esport";
import { gamesListing, trendingListing, upcomingListing } from "@/lib/listing/resources/games";
import { tagPostsListing } from "@/lib/listing/resources/posts";
import {
  buildDefaultListingUrl,
  buildListingUrl,
  defaultListingState,
  resolveListingFallback,
} from "@/lib/listing/url";

describe("buildDefaultListingUrl", () => {
  it.each([
    ["games", gamesListing, "/api/games?locale=fr&page=1&limit=20&fields=description"],
    ["trending", trendingListing, "/api/games/trending?locale=fr&limit=12"],
    ["upcoming", upcomingListing, "/api/games/upcoming?locale=fr&page=1&limit=24"],
    ["characters", charactersListing, "/api/characters?locale=fr&page=1&limit=20"],
    ["esport live", esportLiveListing, "/api/esport/live"],
    ["esport results", esportResultsListing, "/api/esport/results"],
    ["esport tournaments", esportTournamentsListing, "/api/esport/tournaments"],
    ["esport teams", esportTeamsListing, "/api/esport/teams"],
    ["esport players", esportPlayersListing, "/api/esport/players"],
  ] as const)("builds the %s default URL", (_name, resource, expected) => {
    expect(buildDefaultListingUrl(resource, { locale: "fr" })).toBe(expected);
  });

  it("encodes the tag path parameter for tag posts", () => {
    expect(
      buildDefaultListingUrl(tagPostsListing, { locale: "en", pathParams: { tag: "co op" } })
    ).toBe("/api/posts/tags/co%20op?page=1");
  });
});

describe("buildListingUrl", () => {
  it("serializes arrays, skips empty values and keeps explicit false", () => {
    const url = buildListingUrl(
      gamesListing,
      {
        filters: {
          ...gamesListing.defaultFilters,
          genres: ["RPG", "Action"],
          sort: "popularity",
          esport: false,
          themes: ["open-world"],
        },
        page: 3,
      },
      { locale: "en" }
    );
    expect(url).toBe(
      "/api/games?locale=en&page=3&limit=20&fields=description&genres=RPG%2CAction&sort=popularity&esport=false&themes=open-world"
    );
  });

  it("omits the page param on the first esport players page only", () => {
    const context = { locale: "fr" };
    const filters = { search: "faker", game: "LoL" };
    expect(buildListingUrl(esportPlayersListing, { filters, page: 1 }, context)).toBe(
      "/api/esport/players?search=faker&game=LoL"
    );
    expect(buildListingUrl(esportPlayersListing, { filters, page: 2 }, context)).toBe(
      "/api/esport/players?search=faker&game=LoL&page=2"
    );
  });
});

describe("resolveListingFallback", () => {
  const context = { locale: "fr" };
  const fallback = { games: [], pagination: null };

  it("returns the fallback on the default view", () => {
    expect(
      resolveListingFallback(gamesListing, defaultListingState(gamesListing), context, fallback)
    ).toBe(fallback);
  });

  it("drops the fallback once a filter differs from the default query", () => {
    const state = {
      ...defaultListingState(gamesListing),
      filters: { ...gamesListing.defaultFilters, esport: true },
    };
    expect(resolveListingFallback(gamesListing, state, context, fallback)).toBeUndefined();
  });

  it("drops the fallback past the first page", () => {
    const state = { ...defaultListingState(gamesListing), page: 2 };
    expect(resolveListingFallback(gamesListing, state, context, fallback)).toBeUndefined();
  });

  it("keeps the fallback when a filter equals its default value", () => {
    const state = { filters: { ...gamesListing.defaultFilters, genres: [] }, page: 1 };
    expect(resolveListingFallback(gamesListing, state, context, fallback)).toBe(fallback);
  });
});
