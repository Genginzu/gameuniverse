import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PlayerReviewsService } from "@/lib/services/playerReviewsService";

const PLAYER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

const mockResponse = {
  reviews: [
    {
      id: "r1",
      gameId: "g1",
      gameSlug: "zelda",
      gameName: "Zelda",
      gameCoverUrl: null,
      rating: 15,
      content: "Good",
      positivePoints: [],
      negativePoints: [],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  ],
  stats: { totalCount: 1, averageRating: 15, distribution: [] },
  pagination: { currentPage: 1, totalPages: 1, hasNextPage: false },
};

describe("PlayerReviewsService", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should fetch reviews successfully", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await PlayerReviewsService.fetchReviews(PLAYER_ID);

    expect(result).toEqual(mockResponse);
    expect(globalThis.fetch).toHaveBeenCalledOnce();
  });

  it("should propagate error with message from response body", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "Player not found" }),
    });

    await expect(PlayerReviewsService.fetchReviews(PLAYER_ID)).rejects.toThrow("Player not found");
  });

  it("should propagate error with status code when no body message", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("not json")),
    });

    await expect(PlayerReviewsService.fetchReviews(PLAYER_ID)).rejects.toThrow(
      "Failed to fetch reviews (500)"
    );
  });

  it("should construct URL with all parameters", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await PlayerReviewsService.fetchReviews(PLAYER_ID, {
      page: 2,
      sort: "rating_desc",
      locale: "fr",
    });

    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain(`/api/players/${PLAYER_ID}/reviews`);
    expect(url).toContain("page=2");
    expect(url).toContain("sort=rating_desc");
    expect(url).toContain("locale=fr");
  });

  it("should construct URL without undefined parameters", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await PlayerReviewsService.fetchReviews(PLAYER_ID);

    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toBe(`/api/players/${PLAYER_ID}/reviews`);
    expect(url).not.toContain("?");
  });
});
