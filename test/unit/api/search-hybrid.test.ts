import { describe, test, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const mockSearch = vi.fn();
const mockToSearchResultItems = vi.fn();

vi.mock("../../../src/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("../../../src/lib/services/hybridSearchService", () => ({
  HybridSearchService: {
    search: (...args: unknown[]) => mockSearch(...args),
    toSearchResultItems: (...args: unknown[]) => mockToSearchResultItems(...args),
  },
}));

const { GET } = await import("../../../src/app/api/search/hybrid/route");

function makeRequest(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params);
  return new NextRequest(`http://localhost/api/search/hybrid?${qs.toString()}`);
}

describe("GET /api/search/hybrid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns 400 when query < 2 chars", async () => {
    const res = await GET(makeRequest({ query: "a" }));
    expect(res.status).toBe(400);
    expect(mockSearch).not.toHaveBeenCalled();
  });

  test("returns results from HybridSearchService.search", async () => {
    const searchResult = {
      localGames: [{ id: "g1" }],
      igdbGames: [],
      hasMore: false,
      errors: [],
    };
    const items = [{ id: "g1", type: "local" }];

    mockSearch.mockResolvedValue(searchResult);
    mockToSearchResultItems.mockReturnValue(items);

    const res = await GET(makeRequest({ query: "zelda" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results).toEqual(items);
    expect(body.localCount).toBe(1);
    expect(body.igdbCount).toBe(0);
  });

  test("returns 500 on error", async () => {
    mockSearch.mockRejectedValue(new Error("Service down"));
    const res = await GET(makeRequest({ query: "zelda" }));
    expect(res.status).toBe(500);
  });
});
