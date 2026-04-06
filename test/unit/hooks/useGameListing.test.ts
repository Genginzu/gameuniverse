import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createSWRWrapper } from "../../helpers/swr-wrapper";
import { useGameListing, useGenres, usePlatforms } from "@/hooks/useGameListing";

const originalFetch = globalThis.fetch;

const mockGames = [{ id: "g1", title: "Test Game", slug: "test-game" }];
const mockPagination = { currentPage: 1, totalPages: 3, totalCount: 50, limit: 20 };
const mockGenres = [{ id: "gen1", name: "RPG", slug: "rpg" }];
const mockPlatforms = [{ id: "p1", name: "PC", slug: "pc" }];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("useGameListing", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn((url: string) => {
      if (url.startsWith("/api/games"))
        return Promise.resolve(jsonResponse({ games: mockGames, pagination: mockPagination }));
      if (url.startsWith("/api/genres"))
        return Promise.resolve(jsonResponse({ genres: mockGenres }));
      if (url.startsWith("/api/platforms"))
        return Promise.resolve(jsonResponse({ platforms: mockPlatforms }));
      return Promise.resolve(jsonResponse({}, 404));
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches games with correct URL params", async () => {
    const { result } = renderHook(() => useGameListing("fr", 1, [], []), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    const calledUrl = mockFetch.mock.calls.find((c: string[]) => c[0].startsWith("/api/games"))?.[0];
    expect(calledUrl).toContain("locale=fr");
    expect(calledUrl).toContain("page=1");
    expect(calledUrl).toContain("limit=20");
  });

  it("returns games and pagination", async () => {
    const { result } = renderHook(() => useGameListing("fr", 1, [], []), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.games).toEqual(mockGames);
    expect(result.current.pagination).toEqual(mockPagination);
  });

  it("includes genre and platform filters in URL", async () => {
    const { result } = renderHook(() => useGameListing("en", 2, ["rpg"], ["pc"]), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    const calledUrl = mockFetch.mock.calls.find((c: string[]) => c[0].startsWith("/api/games"))?.[0];
    expect(calledUrl).toContain("genres=rpg");
    expect(calledUrl).toContain("platforms=pc");
  });
});

describe("useGenres", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(jsonResponse({ genres: mockGenres }))
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches genres", async () => {
    const { result } = renderHook(() => useGenres("fr"), { wrapper: createSWRWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.genres).toEqual(mockGenres);
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/genres?locale=fr");
  });
});

describe("usePlatforms", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(jsonResponse({ platforms: mockPlatforms }))
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches platforms", async () => {
    const { result } = renderHook(() => usePlatforms("fr"), { wrapper: createSWRWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.platforms).toEqual(mockPlatforms);
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/platforms?locale=fr");
  });
});
