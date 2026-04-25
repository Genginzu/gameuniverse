import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock("@/lib/services/playerStatsService", () => ({
  computeFavoriteGenre: () => ({ name: "RPG", playTime: 100, percentage: 50 }),
  computeTotalPlayTime: (times: number[]) => times.reduce((a, b) => a + b, 0),
  computeReviewStats: (ratings: number[]) => ({
    reviewCount: ratings.length,
    averageRating: ratings.reduce((a, b) => a + b, 0) / ratings.length,
  }),
}));
vi.mock("@/lib/services/playerStatsYearHelpers", () => ({
  extractGenreEntries: () => [{ playTimeHours: 10, genres: ["RPG"] }],
}));

import {
  isStatsPrivate,
  fetchTotalPlayTime,
  fetchReviewStats,
} from "@/lib/services/playerStatsDbHelpers";

describe("playerStatsDbHelpers", () => {
  it("returns privacy status", async () => {
    const sb = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { stats_private: true }, error: null }),
    };
    expect(await isStatsPrivate(sb, "p1")).toBe(true);
  });

  it("computes play time", async () => {
    const sb = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{ play_time_hours: 10 }, { play_time_hours: 20 }],
        error: null,
      }),
    };
    expect(await fetchTotalPlayTime(sb, "p1")).toBe(30);
  });

  it("handles errors gracefully", async () => {
    const sb = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: { message: "fail" } }),
    };
    expect(await fetchTotalPlayTime(sb, "p1")).toBe(0);
  });

  it("returns review stats", async () => {
    const sb = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [{ rating: 10 }, { rating: 20 }], error: null }),
    };
    const stats = await fetchReviewStats(sb, "p1");
    expect(stats.reviewCount).toBe(2);
    expect(stats.averageRating).toBe(15);
  });
});
