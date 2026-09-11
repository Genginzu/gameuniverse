import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { DashboardStatsResponse } from "@/types/dashboard-stats";

// --- Mocks -----------------------------------------------------------

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
  }),
}));

vi.mock("@/lib/services/playerService", () => ({
  PlayerService: { playerExists: vi.fn() },
}));

vi.mock("@/lib/services/dashboardStatsService", () => ({
  DashboardStatsService: { fetchAllStats: vi.fn() },
}));

vi.mock("@/lib/services/playerStatsDbHelpers", () => ({
  isStatsPrivate: vi.fn(),
}));

vi.mock("@/lib/utils/statsFormatters", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils/statsFormatters")>();
  return { ...actual };
});

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// --- Imports (after mocks) -------------------------------------------

import { GET } from "@/app/api/players/[id]/stats/dashboard/route";
import { PlayerService } from "@/lib/services/playerService";
import { DashboardStatsService } from "@/lib/services/dashboardStatsService";
import { isStatsPrivate } from "@/lib/services/playerStatsDbHelpers";

// --- Helpers ---------------------------------------------------------

const VALID_UUID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const OTHER_UUID = "11111111-2222-4333-a444-555555555555";

function makeRequest(id: string, locale?: string): NextRequest {
  const url = locale
    ? `http://localhost/api/players/${id}/stats/dashboard?locale=${locale}`
    : `http://localhost/api/players/${id}/stats/dashboard`;
  return new NextRequest(url);
}

function makeParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

const MOCK_STATS: DashboardStatsResponse = {
  overview: {
    totalGames: 10,
    totalPlayTimeHours: 120,
    reviewCount: 5,
    averageRating: 14.5,
    collectionsCount: 2,
    friendsCount: 3,
  },
  genreDistribution: [{ genre: "RPG", count: 5, percentage: 50 }],
  completion: {
    total: 10,
    owned: 3,
    playing: 2,
    completed: 4,
    wishlist: 1,
    completionPercentage: 40,
  },
  reviewAnalytics: {
    distribution: [{ range: "16-20", min: 16, max: 20, count: 3 }],
    averageRating: 14.5,
    medianRating: 15,
    modeRating: 16,
    maxRating: 18,
    totalReviews: 5,
    helpfulVotesReceived: 8,
  },
  social: { friendsCount: 3, commentsCount: 7, favoritesCount: 4, collectionsCount: 2 },
  activityTimeline: [{ month: 1, year: 2024, label: "janvier", gamesAdded: 2 }],
  playtime: { averagePlayTimeHours: 12, topGame: null, topGames: [] },
  achievements: [{ key: "first_game", unlockedAt: "2024-01-01T00:00:00Z" }],
  achievementDefinitions: [{ key: "first_game", threshold: 1, category: "library" }],
  sessions: {
    totalSessions: 5,
    averageDurationMinutes: 60,
    longestSessionMinutes: 120,
    frequencyByDayOfWeek: [],
  },
  goals: [],
};

// --- Tests -----------------------------------------------------------

describe("GET /api/players/[id]/stats/dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated as the player themselves
    mockGetUser.mockResolvedValue({ data: { user: { id: VALID_UUID } } });
    vi.mocked(PlayerService.playerExists).mockResolvedValue(true);
    vi.mocked(isStatsPrivate).mockResolvedValue(false);
    vi.mocked(DashboardStatsService.fetchAllStats).mockResolvedValue(MOCK_STATS);
  });

  // Req 9.4 — invalid UUID returns 400
  it("returns 400 for invalid UUID", async () => {
    const res = await GET(makeRequest("not-a-uuid"), makeParams("not-a-uuid"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  // Req 9.5 — non-existent player returns 404
  it("returns 404 for non-existent player", async () => {
    vi.mocked(PlayerService.playerExists).mockResolvedValue(false);
    const res = await GET(makeRequest(VALID_UUID), makeParams(VALID_UUID));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  // Req 8.2 — private stats for visitor returns { stats: null, private: true }
  it("returns { stats: null, private: true } for visitor when stats are private", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: OTHER_UUID } } });
    vi.mocked(isStatsPrivate).mockResolvedValue(true);

    const res = await GET(makeRequest(VALID_UUID), makeParams(VALID_UUID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ stats: null, private: true });
  });

  // Req 8.3 — owner sees stats even when private
  it("returns full stats for owner even when stats are private", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: VALID_UUID } } });
    // isStatsPrivate should NOT be called for owner, but even if it were true:
    vi.mocked(isStatsPrivate).mockResolvedValue(true);

    const res = await GET(makeRequest(VALID_UUID), makeParams(VALID_UUID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.overview).toBeDefined();
    expect(body.genreDistribution).toBeDefined();
  });

  // Req 9.2 — valid response with all expected fields
  it("returns valid response with all expected fields", async () => {
    const res = await GET(makeRequest(VALID_UUID), makeParams(VALID_UUID));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.overview).toBeDefined();
    expect(body.genreDistribution).toBeDefined();
    expect(body.completion).toBeDefined();
    expect(body.reviewAnalytics).toBeDefined();
    expect(body.social).toBeDefined();
    expect(body.activityTimeline).toBeDefined();
    expect(body.playtime).toBeDefined();
    expect(body.achievements).toBeDefined();
    expect(body.achievementDefinitions).toBeDefined();
    expect(body.sessions).toBeDefined();
    expect(body.goals).toBeDefined();
  });

  // Req 9.3 — locale param forwarded to service
  it("forwards locale query param to service", async () => {
    await GET(makeRequest(VALID_UUID, "en"), makeParams(VALID_UUID));
    expect(DashboardStatsService.fetchAllStats).toHaveBeenCalledWith(VALID_UUID, "en");
  });

  // 500 on internal error
  it("returns 500 on internal server error", async () => {
    vi.mocked(DashboardStatsService.fetchAllStats).mockRejectedValue(new Error("DB down"));
    const res = await GET(makeRequest(VALID_UUID), makeParams(VALID_UUID));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
