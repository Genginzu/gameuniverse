import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const mockFrom = vi.fn();
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom, rpc: vi.fn() })),
}));

const mockComputeOverview = vi.fn();
vi.mock("@/lib/services/dashboardStatsCompute", () => ({
  computeOverviewMetrics: (...args: any[]) => mockComputeOverview(...args),
  computeGenreDistribution: vi.fn(() => []),
  computeCompletionStats: vi.fn(() => ({})),
  computeReviewDistribution: vi.fn(() => []),
  computeReviewStatistics: vi.fn(() => ({ average: 0, median: 0, mode: 0, max: 0 })),
  computeActivityByMonth: vi.fn(() => []),
  computeAveragePlaytime: vi.fn(() => 0),
  computeTopGame: vi.fn(() => null),
  computeAchievementProgress: vi.fn(() => ({ achievements: [] })),
  computeSessionFrequency: vi.fn(() => []),
  computePlatformDistribution: vi.fn(() => []),
}));
vi.mock("@/lib/utils/untypedTable", () => ({
  untypedTable: (supabase: any, table: string) => supabase.from(table),
}));

import { DashboardStatsService } from "@/lib/services/dashboardStatsService";

/** Build a fully chainable mock that resolves when awaited */
function supaChain(data: unknown, error: unknown = null, count = 0) {
  const c: any = {};
  c.select = vi.fn(() => c);
  c.eq = vi.fn(() => c);
  c.or = vi.fn(() => c);
  c.in = vi.fn(() => c);
  c.then = (res: any) => Promise.resolve({ data, error, count }).then(res);
  return c;
}

describe("DashboardStatsService.fetchOverviewMetrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockComputeOverview.mockReturnValue({
      totalGames: 5,
      totalPlayTimeHours: 100,
      reviewCount: 3,
      averageRating: 4.2,
      collectionsCount: 1,
      friendsCount: 2,
    });
  });

  it("returns overview metrics", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "user_library") return supaChain([{ play_time_hours: 10 }]);
      if (table === "game_reviews") return supaChain([{ rating: 4 }]);
      return supaChain(null, null, 2);
    });
    const result = await DashboardStatsService.fetchOverviewMetrics("player-1");
    expect(result.totalGames).toBe(5);
    expect(mockComputeOverview).toHaveBeenCalled();
  });

  it("throws on supabase error", async () => {
    mockFrom.mockImplementation(() => supaChain(null, { message: "fail" }));
    await expect(DashboardStatsService.fetchOverviewMetrics("p1")).rejects.toThrow("fail");
  });
});
