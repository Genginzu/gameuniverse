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
  teams: [],
  proPlayers: [],
  coaches: [],
  errors: [],
};

const emptyResponse = {
  games: [],
  characters: [],
  players: [],
  teams: [],
  proPlayers: [],
  coaches: [],
  counts: {
    games: 0,
    characters: 0,
    players: 0,
    teams: 0,
    proPlayers: 0,
    coaches: 0,
  },
};

describe("GET /api/search/global", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch.mockResolvedValue(emptySearchResult);
    mockToGlobalSearchResponse.mockReturnValue(emptyResponse);
  });

  // ---------- Validation errors ----------

  it("returns 400 when query is missing", async () => {
    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBeDefined();
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("returns 400 when query is a single character", async () => {
    const response = await GET(makeRequest({ query: "a" }));
    expect(response.status).toBe(400);
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

  it("returns 400 for invalid limit values (Zod rejects non-positive integers)", async () => {
    // With Zod validation, invalid limits fail early instead of being silently coerced
    const response = await GET(
      makeRequest({ query: "test", charactersLimit: "-1" })
    );
    expect(response.status).toBe(400);
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("returns 400 for non-integer limit values", async () => {
    const response = await GET(
      makeRequest({ query: "test", playersLimit: "abc" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 for zero limits (must be positive)", async () => {
    const response = await GET(
      makeRequest({ query: "test", coachesLimit: "0" })
    );
    expect(response.status).toBe(400);
  });

  // ---------- Successful queries ----------

  it("returns 200 with results for a valid query", async () => {
    const response = await GET(makeRequest({ query: "zelda" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(emptyResponse);
    expect(mockSearch).toHaveBeenCalledOnce();
  });

  it("passes the trimmed query and default locale to the service (limits remain undefined)", async () => {
    // Zod doesn't inject defaults for *Limit when omitted — the service's
    // own destructuring defaults handle that. The route just forwards.
    await GET(makeRequest({ query: "mario" }));

    expect(mockSearch).toHaveBeenCalledWith({
      query: "mario",
      locale: "fr",
    });
  });

  it("passes custom locale and limits including the 3 new entity types", async () => {
    await GET(
      makeRequest({
        query: "link",
        locale: "en",
        charactersLimit: "10",
        playersLimit: "2",
        teamsLimit: "3",
        proPlayersLimit: "4",
        coachesLimit: "5",
      })
    );

    expect(mockSearch).toHaveBeenCalledWith({
      query: "link",
      locale: "en",
      charactersLimit: 10,
      playersLimit: 2,
      teamsLimit: 3,
      proPlayersLimit: 4,
      coachesLimit: 5,
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

  // ---------- Response shape includes the 6 groups ----------

  it("forwards the 6-group response from the service", async () => {
    const fullResponse = {
      games: [],
      characters: [],
      players: [],
      teams: [{ id: 100, name: "Team Liquid", slug: "team-liquid" }],
      proPlayers: [{ id: 200, name: "Caps", slug: "caps" }],
      coaches: [
        { id: "c1", username: "topcoach", averageRating: 4.5, totalReviews: 12, isVerified: true },
      ],
      counts: {
        games: 0,
        characters: 0,
        players: 0,
        teams: 1,
        proPlayers: 1,
        coaches: 1,
      },
    };
    mockToGlobalSearchResponse.mockReturnValue(fullResponse);

    const response = await GET(makeRequest({ query: "zelda" }));
    const body = await response.json();

    expect(body).toEqual(fullResponse);
    expect(body.teams).toHaveLength(1);
    expect(body.proPlayers).toHaveLength(1);
    expect(body.coaches).toHaveLength(1);
  });
});
