import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { charactersListing } from "@/lib/listing/resources/characters";
import { esportLiveListing, esportPlayersListing } from "@/lib/listing/resources/esport";
import { gamesListing, trendingListing, upcomingListing } from "@/lib/listing/resources/games";
import { tagPostsListing } from "@/lib/listing/resources/posts";
import { fetchInternalApi, fetchListingDefault } from "@/lib/listing/server";
import { buildListingUrl, defaultListingState } from "@/lib/listing/url";
import { logger } from "@/lib/logger";
import type { ListingContext, ListingResource } from "@/types/listing";

const BASE_URL = "https://gameuniverse.test";
const originalFetch = globalThis.fetch;
const originalBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("fetchListingDefault", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = BASE_URL;
    mockFetch = vi.fn(() => Promise.resolve(jsonResponse({ ok: true })));
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.NEXT_PUBLIC_BASE_URL = originalBaseUrl;
    vi.clearAllMocks();
  });

  it.each<[string, ListingResource<object>, ListingContext]>([
    ["games", gamesListing, { locale: "fr" }],
    ["trending", trendingListing, { locale: "en" }],
    ["upcoming", upcomingListing, { locale: "fr" }],
    ["characters", charactersListing, { locale: "en" }],
    ["esport live", esportLiveListing, { locale: "fr" }],
    ["esport players", esportPlayersListing, { locale: "fr" }],
    ["tag posts", tagPostsListing, { locale: "fr", pathParams: { tag: "rpg" } }],
  ])("requests the same default URL as the client key for %s", async (_name, resource, context) => {
    await fetchListingDefault(resource, context);

    const clientKey = buildListingUrl(resource, defaultListingState(resource), context);
    expect(mockFetch).toHaveBeenCalledWith(`${BASE_URL}${clientKey}`, {
      next: { revalidate: resource.revalidate },
    });
  });

  it("asks the games API for descriptions so the ISR payload matches the client", async () => {
    await fetchListingDefault(gamesListing, { locale: "fr" });
    expect(mockFetch.mock.calls[0][0]).toContain("fields=description");
  });

  it("returns the parsed payload on success", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ games: [], pagination: { totalCount: 0 } }));
    await expect(fetchListingDefault(gamesListing, { locale: "fr" })).resolves.toEqual({
      games: [],
      pagination: { totalCount: 0 },
    });
  });

  it("logs and returns undefined on a non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ error: "boom" }, 500));
    await expect(fetchListingDefault(gamesListing, { locale: "fr" })).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalled();
  });

  it("logs and returns undefined when the request throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network down"));
    await expect(fetchInternalApi("/api/home?locale=fr", 300)).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });
});
