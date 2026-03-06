import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ActivityService } from "@/lib/services/activityService";
import type { ActivityResponse } from "@/types/activity";

const mockFetch = vi.fn<(input: string | URL | Request) => Promise<Response>>();

const PLAYER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

const SAMPLE_RESPONSE: ActivityResponse = {
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

describe("ActivityService", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  describe("fetchActivity", () => {
    it("should return ActivityResponse on successful call", async () => {
      mockFetch.mockResolvedValue(jsonResponse(SAMPLE_RESPONSE));

      const result = await ActivityService.fetchActivity(PLAYER_ID);

      expect(result).toEqual(SAMPLE_RESPONSE);
    });

    it("should throw with server error message on failure", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ error: "Player not found" }, 404));

      await expect(ActivityService.fetchActivity(PLAYER_ID)).rejects.toThrow("Player not found");
    });

    it("should throw with status text when no error field in body", async () => {
      mockFetch.mockResolvedValue(new Response("{}", { status: 500, statusText: "Server Error" }));

      await expect(ActivityService.fetchActivity(PLAYER_ID)).rejects.toThrow(
        "Failed to fetch activity: 500 Server Error"
      );
    });

    it("should throw with status text when body is not JSON", async () => {
      mockFetch.mockResolvedValue(
        new Response("not json", { status: 500, statusText: "Server Error" })
      );

      await expect(ActivityService.fetchActivity(PLAYER_ID)).rejects.toThrow(
        "Failed to fetch activity: 500 Server Error"
      );
    });
  });

  describe("URL construction", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue(jsonResponse(SAMPLE_RESPONSE));
    });

    it("should build URL without query params when none provided", async () => {
      await ActivityService.fetchActivity(PLAYER_ID);

      expect(mockFetch).toHaveBeenCalledWith(`/api/players/${PLAYER_ID}/activity`);
    });

    it("should include page param in URL", async () => {
      await ActivityService.fetchActivity(PLAYER_ID, { page: 3 });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("page=3");
    });

    it("should include type param in URL", async () => {
      await ActivityService.fetchActivity(PLAYER_ID, { type: "review" });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("type=review");
    });

    it("should include locale param in URL", async () => {
      await ActivityService.fetchActivity(PLAYER_ID, { locale: "en" });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("locale=en");
    });

    it("should include all params when provided", async () => {
      await ActivityService.fetchActivity(PLAYER_ID, {
        page: 2,
        type: "comment",
        locale: "en",
      });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("page=2");
      expect(calledUrl).toContain("type=comment");
      expect(calledUrl).toContain("locale=en");
      expect(calledUrl).toContain(`/api/players/${PLAYER_ID}/activity?`);
    });
  });
});
