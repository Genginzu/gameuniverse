import { describe, it, expect } from "vitest";
import {
  computeOverviewMetrics,
  computeGenreDistribution,
  computeCompletionStats,
  computeReviewDistribution,
  computeReviewStatistics,
  computeActivityByMonth,
  computeAveragePlaytime,
  computeSessionFrequency,
  computePlatformDistribution,
} from "@/lib/services/dashboardStatsCompute";
import { ACHIEVEMENT_DEFINITIONS } from "@/types/dashboard-stats";

/**
 * Unit tests for dashboardStatsCompute edge cases.
 * Property-based tests are in dashboardStatsCompute.property.test.ts.
 */

// --- Req 1.5: Empty library returns zero metrics ---
describe("computeOverviewMetrics — empty inputs", () => {
  it("returns all zeros and null averageRating when no data exists", () => {
    const result = computeOverviewMetrics([], [], [], []);

    expect(result.totalGames).toBe(0);
    expect(result.totalPlayTimeHours).toBe(0);
    expect(result.reviewCount).toBe(0);
    expect(result.averageRating).toBeNull();
    expect(result.collectionsCount).toBe(0);
    expect(result.friendsCount).toBe(0);
  });
});

// --- Req 2.6: Empty genre list returns empty distribution ---
describe("computeGenreDistribution — empty inputs", () => {
  it("returns an empty array when no library entries exist", () => {
    const result = computeGenreDistribution([]);
    expect(result).toEqual([]);
  });
});

// --- Req 3.4: Zero completion returns 0% ---
describe("computeCompletionStats — empty inputs", () => {
  it("returns total 0 and completionPercentage 0 with no entries", () => {
    const result = computeCompletionStats([]);

    expect(result.total).toBe(0);
    expect(result.owned).toBe(0);
    expect(result.playing).toBe(0);
    expect(result.completed).toBe(0);
    expect(result.wishlist).toBe(0);
    expect(result.completionPercentage).toBe(0);
  });
});

// --- Req 4.4: No reviews returns null statistics ---
describe("computeReviewDistribution — empty inputs", () => {
  it("returns 4 buckets all with count 0 when no ratings exist", () => {
    const result = computeReviewDistribution([]);

    expect(result).toHaveLength(4);
    for (const bucket of result) {
      expect(bucket.count).toBe(0);
    }
  });
});

describe("computeReviewStatistics — empty inputs", () => {
  it("returns null for average, median, mode, and max when no ratings exist", () => {
    const result = computeReviewStatistics([]);

    expect(result.average).toBeNull();
    expect(result.median).toBeNull();
    expect(result.mode).toBeNull();
    expect(result.max).toBeNull();
  });
});

// --- Req 5.5: No social activity returns zeros ---
describe("computeOverviewMetrics — no social activity", () => {
  it("returns zero for collections and friends with empty social arrays", () => {
    const result = computeOverviewMetrics([], [], [], []);

    expect(result.collectionsCount).toBe(0);
    expect(result.friendsCount).toBe(0);
  });
});

// --- Req 6.5: No activity in 12 months returns 12 zero entries ---
describe("computeActivityByMonth — no activity", () => {
  it("returns 12 entries all with gamesAdded 0 when no entries exist", () => {
    const refDate = new Date(2024, 5, 15); // June 2024
    const result = computeActivityByMonth([], refDate, "fr");

    expect(result).toHaveLength(12);
    for (const entry of result) {
      expect(entry.gamesAdded).toBe(0);
    }
  });
});

// --- Req 7.4: No play time returns null average ---
describe("computeAveragePlaytime — no play time", () => {
  it("returns null when given an empty array", () => {
    expect(computeAveragePlaytime([])).toBeNull();
  });

  it("returns null when all play times are zero", () => {
    expect(computeAveragePlaytime([0, 0, 0])).toBeNull();
  });
});

// --- Req 12.4: No sessions returns empty stats ---
describe("computeSessionFrequency — no sessions", () => {
  it("returns 7 entries all with sessionCount 0 when no sessions exist", () => {
    const result = computeSessionFrequency([]);

    expect(result).toHaveLength(7);
    for (const entry of result) {
      expect(entry.sessionCount).toBe(0);
    }
  });
});

// --- Req 11.1: Achievement definitions has 10 entries ---
describe("ACHIEVEMENT_DEFINITIONS", () => {
  it("contains exactly 10 achievement definitions", () => {
    expect(ACHIEVEMENT_DEFINITIONS).toHaveLength(10);
  });
});

// --- Req 5.1, 5.2, 5.3: Platform distribution ---
describe("computePlatformDistribution", () => {
  it("returns empty array for empty library", () => {
    const result = computePlatformDistribution([]);
    expect(result).toEqual([]);
  });

  it("returns empty array when all games have no platforms", () => {
    const result = computePlatformDistribution([{ platforms: [] }, { platforms: [] }]);
    expect(result).toEqual([]);
  });

  it("counts multi-platform game correctly", () => {
    const result = computePlatformDistribution([{ platforms: ["PS5", "PC", "Xbox"] }]);

    expect(result).toHaveLength(3);
    // Each platform has count 1
    for (const entry of result) {
      expect(entry.count).toBe(1);
    }
    // Each percentage ≈ 33.3%
    const totalPct = result.reduce((sum, e) => sum + e.percentage, 0);
    expect(totalPct).toBeCloseTo(100, 0);
  });

  it("computes correct percentages for uneven distribution", () => {
    const result = computePlatformDistribution([
      { platforms: ["PS5"] },
      { platforms: ["PS5"] },
      { platforms: ["PS5"] },
      { platforms: ["PC"] },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].platform).toBe("PS5");
    expect(result[0].count).toBe(3);
    expect(result[0].percentage).toBe(75);
    expect(result[1].platform).toBe("PC");
    expect(result[1].count).toBe(1);
    expect(result[1].percentage).toBe(25);
  });

  it("sorts entries by count descending", () => {
    const result = computePlatformDistribution([
      { platforms: ["Switch"] },
      { platforms: ["PC", "PS5"] },
      { platforms: ["PC"] },
      { platforms: ["PC", "PS5", "Switch"] },
    ]);

    // PC: 3, PS5: 2, Switch: 2
    expect(result[0].platform).toBe("PC");
    expect(result[0].count).toBe(3);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].count).toBeGreaterThanOrEqual(result[i].count);
    }
  });
});
