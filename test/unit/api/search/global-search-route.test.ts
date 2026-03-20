import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import type { GlobalSearchResult } from "@/types/global-search";

const mockSearch = vi.fn();
const mockToGlobalSearchResponse = vi.fn();

vi.mock("@/lib/services/globalSearchService", () => ({
  GlobalSearchService: {
    search: (...args: unknown[]) => mockSearch(...args),
    toGlobalSearchResponse: (...args: unknown[]) => mockToGlobalSearchResponse(...args),
  },
}));

import { GET } from "@/app/api/search/global/route";

function makeRequest(queryParams: Record<string, string> = {}) {
  const params = new URLSearchParams(queryParams);
  return new NextRequest(`http://localhost/api/search/global?${params.toString()}`);
}

const emptySearchResult: GlobalSearchResult = {
  games: { local: [], igdb: [] },
  characters: [],
  players: [],
  errors: [],
};

const emptyResponse = {
  games: [],
  characters: [],
  players: [],
  counts: { games: 0, characters: 0, players: 0 },
};

describe("GET /api/search/global", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch.mockResolvedValue(emptySearchResult);
    mockToGlobalSearchResponse.mockReturnValue(emptyResponse);
  });

  it("returns 400 when query is missing", async () => {
    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBeDefined();
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("returns 400 when query is a single character", async () => {
    const response = await GET(makeRequest({ query: "a" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBeDefined();
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("returns 400 when query is only whitespace", async () => {
    const response = await GET(makeRequest({ query: "   " }));

    expect(response.status).toBe(400);
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("returns 400 when trimmed query is less than 2 chars", async () => {
    const response = await GET(makeRequest({ query: " x " }));

    expect(response.status).toBe(400);
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("returns 200 with results for a valid query", async () => {
    const response = await GET(makeRequest({ query: "zelda" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(emptyResponse);
    expect(mockSearch).toHaveBeenCalledOnce();
  });

  it("passes query and default params to GlobalSearchService.search", async () => {
    await GET(makeRequest({ query: "mario" }));

    expect(mockSearch).toHaveBeenCalledWith({
      query: "mario",
      locale: "fr",
      charactersLimit: 5,
      playersLimit: 5,
    });
  });

  it("passes custom locale and limits", async () => {
    await GET(
      makeRequest({
        query: "link",
        locale: "en",
        charactersLimit: "10",
        playersLimit: "2",
      })
    );

    expect(mockSearch).toHaveBeenCalledWith({
      query: "link",
      locale: "en",
      charactersLimit: 10,
      playersLimit: 2,
    });
  });

  it("falls back to default limit for invalid limit values", async () => {
    await GET(
      makeRequest({
        query: "test",
        charactersLimit: "-1",
        playersLimit: "0",
      })
    );

    expect(mockSearch).toHaveBeenCalledWith({
      query: "test",
      locale: "fr",
      charactersLimit: 5,
      playersLimit: 5,
    });
  });

  it("trims the query before passing to service", async () => {
    await GET(makeRequest({ query: "  zelda  " }));

    expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({ query: "zelda" }));
  });

  it("calls toGlobalSearchResponse with the search result", async () => {
    const customResult = { ...emptySearchResult, errors: ["test error"] };
    mockSearch.mockResolvedValue(customResult);

    await GET(makeRequest({ query: "test" }));

    expect(mockToGlobalSearchResponse).toHaveBeenCalledWith(customResult);
  });

  it("returns 500 when service throws an unexpected error", async () => {
    mockSearch.mockRejectedValue(new Error("Unexpected failure"));

    const response = await GET(makeRequest({ query: "crash" }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBeDefined();
  });
});
