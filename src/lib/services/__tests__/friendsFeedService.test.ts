import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FriendsFeedService } from "@/lib/services/friendsFeedService";
import type { FeedResponse } from "@/types/feed";

const mockFetch = vi.fn<(input: string | URL | Request) => Promise<Response>>();

const SAMPLE_RESPONSE: FeedResponse = {
  events: [
    {
      id: "evt-1",
      type: "review",
      date: "2024-03-01T12:00:00Z",
      data: {
        type: "review",
        gameId: "g1",
        gameSlug: "zelda",
        gameName: "Zelda",
        rating: 18,
        contentExcerpt: "Excellent jeu",
        actor: { id: "u1", username: "alice", avatarUrl: null },
      },
    },
  ],
  pagination: { currentPage: 1, totalPages: 1, hasNextPage: false },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("FriendsFeedService", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  describe("fetchFeed", () => {
    it("should return FeedResponse on successful call", async () => {
      mockFetch.mockResolvedValue(jsonResponse(SAMPLE_RESPONSE));

      const result = await FriendsFeedService.fetchFeed();

      expect(result).toEqual(SAMPLE_RESPONSE);
    });

    it("should throw with server error message on failure", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ error: "Unauthorized" }, 401));

      await expect(FriendsFeedService.fetchFeed()).rejects.toThrow("Unauthorized");
    });

    it("should throw with status text when no error field in body", async () => {
      mockFetch.mockResolvedValue(
        new Response("{}", { status: 500, statusText: "Server Error" })
      );

      await expect(FriendsFeedService.fetchFeed()).rejects.toThrow(
        "Failed to fetch feed: 500"
      );
    });
  });

  describe("URL construction", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue(jsonResponse(SAMPLE_RESPONSE));
    });

    it("should build URL without query params when none provided", async () => {
      await FriendsFeedService.fetchFeed();

      expect(mockFetch).toHaveBeenCalledWith("/api/feed");
    });

    it("should include page param in URL", async () => {
      await FriendsFeedService.fetchFeed({ page: 3 });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("page=3");
    });

    it("should include type param in URL", async () => {
      await FriendsFeedService.fetchFeed({ type: "review" });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("type=review");
    });

    it("should include locale param in URL", async () => {
      await FriendsFeedService.fetchFeed({ locale: "en" });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("locale=en");
    });

    it("should include all params when provided", async () => {
      await FriendsFeedService.fetchFeed({ page: 2, type: "post", locale: "en" });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("page=2");
      expect(calledUrl).toContain("type=post");
      expect(calledUrl).toContain("locale=en");
      expect(calledUrl).toContain("/api/feed?");
    });
  });
});
