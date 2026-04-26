import { describe, it, expect } from "vitest";
import { buildEmptyGamesResponse } from "@/lib/services/gameListingHelpers";

describe("gameListingHelpers", () => {
  it("returns correct empty response structure", () => {
    const filters = { search: "", genres: [], platforms: [], locale: "fr", inLibrary: false };
    const result = buildEmptyGamesResponse(1, 20, 0, filters);

    expect(result.games).toEqual([]);
    expect(result.pagination).toEqual({
      currentPage: 1,
      totalPages: 0,
      totalCount: 0,
      limit: 20,
      hasNextPage: false,
      hasPreviousPage: false,
      offset: 0,
    });
    expect(result.filters).toEqual(filters);
  });

  it("respects custom page and limit", () => {
    const filters = {
      search: "test",
      genres: ["RPG"],
      platforms: [],
      locale: "en",
      inLibrary: true,
    };
    const result = buildEmptyGamesResponse(3, 10, 20, filters);
    expect(result.pagination.currentPage).toBe(3);
    expect(result.pagination.limit).toBe(10);
    expect(result.pagination.offset).toBe(20);
    expect(result.filters.search).toBe("test");
  });
});
