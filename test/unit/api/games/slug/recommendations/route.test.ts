import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import type { GameRecommendation } from "@/types/recommendation";

// vi.hoisted ensures mock fns are available when vi.mock factories run
const { mockGetUser, mockFrom, mockGetRecommendationsForGame, mockFetchUserLibraryGameIds } =
  vi.hoisted(() => ({
    mockGetUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    mockFrom: vi.fn(),
    mockGetRecommendationsForGame: vi.fn(() => Promise.resolve([])),
    mockFetchUserLibraryGameIds: vi.fn(() => Promise.resolve([])),
  }));

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
};

vi.mock("../../../../../../src/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock("../../../../../../src/lib/services/recommendationService", () => ({
  getRecommendationsForGame: mockGetRecommendationsForGame,
}));

vi.mock("../../../../../../src/lib/services/recommendation/dataFetchers", () => ({
  fetchUserLibraryGameIds: mockFetchUserLibraryGameIds,
}));

import { GET } from "../../../../../../src/app/api/games/[slug]/recommendations/route";

const GAME_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const USER_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

function makeParams(slug = "zelda-totk"): { params: Promise<{ slug: string }> } {
  return { params: Promise.resolve({ slug }) };
}

function mockGameFound(id = GAME_ID) {
  mockFrom.mockReturnValue({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: { id }, error: null }),
      }),
    }),
  });
}

function mockGameNotFound() {
  mockFrom.mockReturnValue({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: { code: "PGRST116" } }),
      }),
    }),
  });
}

function mockAuthenticated(id = USER_ID) {
  mockGetUser.mockResolvedValue({ data: { user: { id } }, error: null });
}

function mockUnauthenticated() {
  mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
}

const SAMPLE_RECOMMENDATIONS: GameRecommendation[] = [
  {
    id: "rec-1",
    slug: "elden-ring",
    title: "Elden Ring",
    coverImage: "/images/elden.jpg",
    genres: [{ id: "g1", name: "RPG" }],
    developer: "FromSoftware",
    combinedScore: 0.85,
  },
  {
    id: "rec-2",
    slug: "hollow-knight",
    title: "Hollow Knight",
    coverImage: "/images/hollow.jpg",
    genres: [{ id: "g2", name: "Metroidvania" }],
    developer: "Team Cherry",
    combinedScore: 0.72,
  },
];

describe("/api/games/[slug]/recommendations", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockFrom.mockReset();
    mockGetRecommendationsForGame.mockReset().mockResolvedValue(SAMPLE_RECOMMENDATIONS);
    mockFetchUserLibraryGameIds.mockReset().mockResolvedValue([]);
    mockUnauthenticated();
  });

  // Requirement 5.2 — 404 when game slug does not exist
  it("should return 404 when game slug does not exist", async () => {
    mockGameNotFound();
    const req = new NextRequest("http://localhost/api/games/nonexistent/recommendations");
    const res = await GET(req, makeParams("nonexistent"));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Game not found");
  });

  // Requirement 5.1 — 200 with recommendations
  it("should return 200 with recommendations for a valid slug", async () => {
    mockGameFound();
    const req = new NextRequest("http://localhost/api/games/zelda-totk/recommendations");
    const res = await GET(req, makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.recommendations).toEqual(SAMPLE_RECOMMENDATIONS);
    expect(body.sourceGameId).toBe(GAME_ID);
    expect(body.generatedAt).toBeDefined();
  });

  // Requirement 5.4 — response includes required fields
  it("should include sourceGameId and generatedAt in response", async () => {
    mockGameFound();
    const req = new NextRequest("http://localhost/api/games/zelda-totk/recommendations");
    const res = await GET(req, makeParams());
    const body = await res.json();

    expect(body).toHaveProperty("recommendations");
    expect(body).toHaveProperty("sourceGameId");
    expect(body).toHaveProperty("generatedAt");
    // generatedAt should be a valid ISO date
    expect(new Date(body.generatedAt).toISOString()).toBe(body.generatedAt);
  });

  // Requirement 5.3 — limit query parameter
  it("should pass limit query parameter to the service", async () => {
    mockGameFound();
    const req = new NextRequest("http://localhost/api/games/zelda-totk/recommendations?limit=5");
    await GET(req, makeParams());

    expect(mockGetRecommendationsForGame).toHaveBeenCalledWith(GAME_ID, {
      limit: 5,
      excludeGameIds: [],
    });
  });

  it("should default limit to 10 when not provided", async () => {
    mockGameFound();
    const req = new NextRequest("http://localhost/api/games/zelda-totk/recommendations");
    await GET(req, makeParams());

    expect(mockGetRecommendationsForGame).toHaveBeenCalledWith(GAME_ID, {
      limit: 10,
      excludeGameIds: [],
    });
  });

  it("should fallback to 10 when limit is invalid", async () => {
    mockGameFound();
    const req = new NextRequest("http://localhost/api/games/zelda-totk/recommendations?limit=abc");
    await GET(req, makeParams());

    expect(mockGetRecommendationsForGame).toHaveBeenCalledWith(GAME_ID, {
      limit: 10,
      excludeGameIds: [],
    });
  });

  it("should fallback to 10 when limit is negative", async () => {
    mockGameFound();
    const req = new NextRequest("http://localhost/api/games/zelda-totk/recommendations?limit=-3");
    await GET(req, makeParams());

    expect(mockGetRecommendationsForGame).toHaveBeenCalledWith(GAME_ID, {
      limit: 10,
      excludeGameIds: [],
    });
  });

  // Requirement 5.5 — exclude library games for authenticated users
  it("should exclude library games when user is authenticated", async () => {
    mockGameFound();
    mockAuthenticated();
    const libraryGameIds = ["lib-game-1", "lib-game-2"];
    mockFetchUserLibraryGameIds.mockResolvedValue(libraryGameIds);

    const req = new NextRequest("http://localhost/api/games/zelda-totk/recommendations");
    await GET(req, makeParams());

    expect(mockFetchUserLibraryGameIds).toHaveBeenCalledWith(USER_ID);
    expect(mockGetRecommendationsForGame).toHaveBeenCalledWith(GAME_ID, {
      limit: 10,
      excludeGameIds: libraryGameIds,
    });
  });

  it("should not fetch library when user is not authenticated", async () => {
    mockGameFound();
    mockUnauthenticated();

    const req = new NextRequest("http://localhost/api/games/zelda-totk/recommendations");
    await GET(req, makeParams());

    expect(mockFetchUserLibraryGameIds).not.toHaveBeenCalled();
    expect(mockGetRecommendationsForGame).toHaveBeenCalledWith(GAME_ID, {
      limit: 10,
      excludeGameIds: [],
    });
  });

  // 500 on unexpected error
  it("should return 500 on unexpected error", async () => {
    mockGameFound();
    mockGetRecommendationsForGame.mockRejectedValue(new Error("DB down"));

    const req = new NextRequest("http://localhost/api/games/zelda-totk/recommendations");
    const res = await GET(req, makeParams());
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Failed to compute recommendations");
  });

  // Empty recommendations — 200 with empty array
  it("should return 200 with empty array when no recommendations found", async () => {
    mockGameFound();
    mockGetRecommendationsForGame.mockResolvedValue([]);

    const req = new NextRequest("http://localhost/api/games/zelda-totk/recommendations");
    const res = await GET(req, makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.recommendations).toEqual([]);
  });
});
