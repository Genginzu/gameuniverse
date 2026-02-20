import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const PLAYER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const VISITOR_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

const { mockGetUser, mockValidatePlayerId, mockPlayerExists, mockFetchYearInReview } = vi.hoisted(
  () => ({
    mockGetUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    mockValidatePlayerId: vi.fn(() => true),
    mockPlayerExists: vi.fn(() => Promise.resolve(true)),
    mockFetchYearInReview: vi.fn(() =>
      Promise.resolve({
        year: 2024,
        totalPlayTime: 320.5,
        gamesAdded: 15,
        favoriteGenre: { name: "Action", playTime: 120.0 },
        topGame: { id: "uuid", title: "Elden Ring", coverImage: null, playTime: 85.0 },
        reviewCount: 5,
        mostActiveMonth: { month: 3, gamesAdded: 5 },
        availableYears: [2023, 2024],
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
    fetchYearInReview: mockFetchYearInReview,
  },
}));

import { GET } from "../../../../../src/app/api/players/[id]/year/[year]/route";

function makeParams(
  id = PLAYER_ID,
  year = "2024"
): { params: Promise<{ id: string; year: string }> } {
  return { params: Promise.resolve({ id, year }) };
}

describe("/api/players/[id]/year/[year]", () => {
  beforeEach(() => {
    mockGetUser.mockReset().mockResolvedValue({ data: { user: null }, error: null });
    mockValidatePlayerId.mockReset().mockReturnValue(true);
    mockPlayerExists.mockReset().mockResolvedValue(true);
    mockFetchYearInReview.mockReset().mockResolvedValue({
      year: 2024,
      totalPlayTime: 320.5,
      gamesAdded: 15,
      favoriteGenre: { name: "Action", playTime: 120.0 },
      topGame: { id: "uuid", title: "Elden Ring", coverImage: null, playTime: 85.0 },
      reviewCount: 5,
      mostActiveMonth: { month: 3, gamesAdded: 5 },
      availableYears: [2023, 2024],
    });
  });

  // Requirement 10.3 — 400 for invalid player ID
  it("should return 400 for invalid player ID", async () => {
    mockValidatePlayerId.mockReturnValue(false);
    const req = new NextRequest("http://localhost/api/players/not-a-uuid/year/2024");
    const res = await GET(req, makeParams("not-a-uuid", "2024"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Format d'identifiant invalide");
  });

  // 400 for invalid year format
  it("should return 400 for invalid year format", async () => {
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/year/abc`);
    const res = await GET(req, makeParams(PLAYER_ID, "abc"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Format d'année invalide");
  });

  it("should return 400 for non-4-digit year", async () => {
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/year/99`);
    const res = await GET(req, makeParams(PLAYER_ID, "99"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Format d'année invalide");
  });

  // Requirement 5.4 — 400 for future year
  it("should return 400 for future year", async () => {
    const futureYear = String(new Date().getFullYear() + 1);
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/year/${futureYear}`);
    const res = await GET(req, makeParams(PLAYER_ID, futureYear));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("L'année demandée est dans le futur");
  });

  // Requirement 10.2 — 404 for non-existent player
  it("should return 404 for non-existent player", async () => {
    mockFetchYearInReview.mockResolvedValue(null);
    mockPlayerExists.mockResolvedValue(false);
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/year/2024`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Joueur non trouvé");
  });

  // Requirement 8.2 — private stats return { yearReview: null, private: true }
  it("should return 200 with yearReview null when stats are private", async () => {
    mockFetchYearInReview.mockResolvedValue(null);
    mockPlayerExists.mockResolvedValue(true);
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/year/2024`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ yearReview: null, private: true });
  });

  // Success case
  it("should return 200 with yearReview on success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: VISITOR_ID } }, error: null });
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/year/2024`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.yearReview.year).toBe(2024);
    expect(body.yearReview.totalPlayTime).toBe(320.5);
    expect(body.yearReview.gamesAdded).toBe(15);
  });

  // 500 on unexpected error
  it("should return 500 on unexpected error", async () => {
    mockFetchYearInReview.mockRejectedValue(new Error("DB down"));
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/year/2024`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Internal server error");
  });

  // Defaults locale to "fr"
  it("should default locale to fr", async () => {
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/year/2024`);
    await GET(req, makeParams());
    expect(mockFetchYearInReview).toHaveBeenCalledWith(PLAYER_ID, 2024, "fr", null);
  });

  it("should pass locale query parameter", async () => {
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/year/2024?locale=en`);
    await GET(req, makeParams());
    expect(mockFetchYearInReview).toHaveBeenCalledWith(PLAYER_ID, 2024, "en", null);
  });
});
