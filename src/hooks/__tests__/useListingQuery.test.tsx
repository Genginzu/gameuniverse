import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { useListingQuery } from "@/hooks/useListingQuery";
import { gamesListing } from "@/lib/listing/resources/games";
import { buildDefaultListingUrl } from "@/lib/listing/url";
import { createSWRWrapper } from "@/test-helpers/swr-wrapper";
import type { GamesApiResponse } from "@/types/game";

const originalFetch = globalThis.fetch;

const FALLBACK: GamesApiResponse = {
  games: [{ id: "ssr", slug: "ssr", title: "SSR", genres: [], developer: "", publisher: "" }],
  pagination: {
    currentPage: 1,
    totalPages: 3,
    totalCount: 60,
    hasNextPage: true,
    hasPreviousPage: false,
  },
};

const FETCHED: GamesApiResponse = {
  ...FALLBACK,
  games: [{ id: "net", slug: "net", title: "Net", genres: [], developer: "", publisher: "" }],
};

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

const requestedUrls = (mock: ReturnType<typeof vi.fn>) =>
  mock.mock.calls.map((call) => String(call[0]));

describe("useListingQuery", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn(() => Promise.resolve(jsonResponse(FETCHED)));
    globalThis.fetch = mockFetch as unknown as typeof fetch;
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const renderListing = (fallbackData?: GamesApiResponse) =>
    renderHook(() => useListingQuery(gamesListing, { locale: "fr", fallbackData }), {
      wrapper: createSWRWrapper(),
    });

  it("serves the ISR fallback immediately on the default view and keys on the default URL", async () => {
    const { result } = renderListing(FALLBACK);

    expect(result.current.data).toEqual(FALLBACK);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(requestedUrls(mockFetch)[0]).toBe(
      buildDefaultListingUrl(gamesListing, { locale: "fr" })
    );
  });

  it("fetches the filtered URL without the fallback once a filter changes", async () => {
    const { result } = renderListing(FALLBACK);

    act(() => result.current.setFilters({ genres: ["RPG"] }));

    expect(result.current.filters.genres).toEqual(["RPG"]);
    await waitFor(() => expect(result.current.data).toEqual(FETCHED));
    expect(requestedUrls(mockFetch)).toContain(
      "/api/games?locale=fr&page=1&limit=20&fields=description&genres=RPG"
    );
  });

  it("resets the page to 1 in the filter setter and scrolls on page change", async () => {
    const { result } = renderListing();

    act(() => result.current.setPage(3));
    expect(result.current.page).toBe(3);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });

    act(() => result.current.setFilters({ esport: true }));
    expect(result.current.page).toBe(1);

    await waitFor(() =>
      expect(requestedUrls(mockFetch)).toContain(
        "/api/games?locale=fr&page=1&limit=20&fields=description&esport=true"
      )
    );
    expect(requestedUrls(mockFetch).some((url) => url.includes("esport=true&page=3"))).toBe(false);
  });

  it("restores the default filters on reset", () => {
    const { result } = renderListing();

    act(() => result.current.setFilters({ platforms: ["pc"], sort: "rating" }));
    act(() => result.current.resetFilters());

    expect(result.current.filters).toEqual(gamesListing.defaultFilters);
    expect(result.current.page).toBe(1);
  });
});
