import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const PLAYER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const VISITOR_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

const { mockGetUser, mockValidatePlayerId, mockPlayerExists, mockFetchEnrichedStats } = vi.hoisted(
  () => ({
    mockGetUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    mockValidatePlayerId: vi.fn(() => true),
    mockPlayerExists: vi.fn(() => Promise.resolve(true)),
    mockFetchEnrichedStats: vi.fn(() =>
      Promise.resolve({
        totalPlayTime: 100.5,
        favoriteGenre: { name: "RPG", playTime: 45.2 },
        reviewCount: 5,
        averageReviewRating: 14.0,
      })
    ),
  })
);

const mockSupabase = { auth: { getUser: mockGetUser } };

vi.mock("../../../../../src/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock("../../../../../src/lib/services/playerService", () => ({
  PlayerService: {
    validatePlayerId: mockValidatePlayerId,
    playerExists: mockPlayerExists,
  },
}));

vi.mock("../../../../../src/lib/services/playerStatsService", () => ({
  PlayerStatsService: {
    fetchEnrichedStats: mockFetchEnrichedStats,
  },
}));

import { GET } from "../../../../../src/app/api/players/[id]/stats/route";

function makeParams(id = PLAYER_ID): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe("/api/players/[id]/stats", () => {
  beforeEach(() => {
    mockGetUser.mockReset().mockResolvedValue({ data: { user: null }, error: null });
    mockValidatePlayerId.mockReset().mockReturnValue(true);
    mockPlayerExists.mockReset().mockResolvedValue(true);
    mockFetchEnrichedStats.mockReset().mockResolvedValue({
      totalPlayTime: 100.5,
      favoriteGenre: { name: "RPG", playTime: 45.2 },
      reviewCount: 5,
      averageReviewRating: 14.0,
    });
  });

  // Requirement 10.3 — 400 for invalid player ID
  it("should return 400 for invalid player ID", async () => {
    mockValidatePlayerId.mockReturnValue(false);
    const req = new NextRequest("http://localhost/api/players/not-a-uuid/stats");
    const res = await GET(req, makeParams("not-a-uuid"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Format d'identifiant invalide");
  });

  // Requirement 10.2 — 404 for non-existent player
  it("should return 404 for non-existent player", async () => {
    mockFetchEnrichedStats.mockResolvedValue(null);
    mockPlayerExists.mockResolvedValue(false);
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/stats`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Joueur non trouvé");
  });

  // Requirement 8.2 — private stats return { stats: null, private: true }
  it("should return 200 with stats null when stats are private", async () => {
    mockFetchEnrichedStats.mockResolvedValue(null);
    mockPlayerExists.mockResolvedValue(true);
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/stats`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ stats: null, private: true });
  });

  // Success case
  it("should return 200 with stats on success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: VISITOR_ID } }, error: null });
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/stats`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stats).toEqual({
      totalPlayTime: 100.5,
      favoriteGenre: { name: "RPG", playTime: 45.2 },
      reviewCount: 5,
      averageReviewRating: 14.0,
    });
  });

  // 500 on unexpected error
  it("should return 500 on unexpected error", async () => {
    mockFetchEnrichedStats.mockRejectedValue(new Error("DB down"));
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/stats`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Internal server error");
  });

  // Defaults locale to "fr"
  it("should default locale to fr", async () => {
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/stats`);
    await GET(req, makeParams());
    expect(mockFetchEnrichedStats).toHaveBeenCalledWith(PLAYER_ID, "fr", null);
  });

  it("should pass locale query parameter", async () => {
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/stats?locale=en`);
    await GET(req, makeParams());
    expect(mockFetchEnrichedStats).toHaveBeenCalledWith(PLAYER_ID, "en", null);
  });
});
