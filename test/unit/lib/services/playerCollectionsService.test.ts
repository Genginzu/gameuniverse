import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  PlayerCollectionsService,
  buildCollectionsUrl,
} from "@/lib/services/playerCollectionsService";
import type { PlayerCollectionsResponse } from "@/types/playerCollection";

const PLAYER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

const mockResponse: PlayerCollectionsResponse = {
  collections: [
    {
      id: "c1",
      name: "RPGs",
      slug: "rpgs",
      description: "My RPG collection",
      isPublic: true,
      gamesCount: 5,
      updatedAt: "2024-06-01T00:00:00Z",
      coverImages: [],
      coverImageUrl: null,
    },
  ],
  stats: { totalCollections: 1, totalGames: 5, largestCollection: "RPGs" },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCollections: 1,
    hasNextPage: false,
  },
};

describe("PlayerCollectionsService", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should fetch collections successfully", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await PlayerCollectionsService.fetchCollections(PLAYER_ID);

    expect(result).toEqual(mockResponse);
    expect(globalThis.fetch).toHaveBeenCalledOnce();
  });

  it("should propagate error with message from response body", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "Player not found" }),
    });

    await expect(PlayerCollectionsService.fetchCollections(PLAYER_ID)).rejects.toThrow(
      "Player not found"
    );
  });

  it("should propagate error with status code when no body message", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("not json")),
    });

    await expect(PlayerCollectionsService.fetchCollections(PLAYER_ID)).rejects.toThrow(
      "Failed to fetch collections (500)"
    );
  });
});

describe("buildCollectionsUrl", () => {
  it("should build URL with all parameters", () => {
    const url = buildCollectionsUrl(PLAYER_ID, {
      page: 2,
      sort: "name_asc",
      locale: "fr",
    });

    expect(url).toContain(`/api/players/${PLAYER_ID}/collections`);
    expect(url).toContain("page=2");
    expect(url).toContain("sort=name_asc");
    expect(url).toContain("locale=fr");
  });

  it("should build URL without undefined parameters", () => {
    const url = buildCollectionsUrl(PLAYER_ID, {});

    expect(url).toBe(`/api/players/${PLAYER_ID}/collections`);
    expect(url).not.toContain("?");
  });

  it("should include only defined parameters", () => {
    const url = buildCollectionsUrl(PLAYER_ID, { page: 3 });

    expect(url).toContain("page=3");
    expect(url).not.toContain("sort");
    expect(url).not.toContain("locale");
  });
});
