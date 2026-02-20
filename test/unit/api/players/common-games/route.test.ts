import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// vi.hoisted ensures mock fns are available when vi.mock factories run
const { mockGetUser, mockValidatePlayerId, mockPlayerExists, mockGetCommonGames } = vi.hoisted(
  () => ({
    mockGetUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    mockValidatePlayerId: vi.fn(() => true),
    mockPlayerExists: vi.fn(() => Promise.resolve(true)),
    mockGetCommonGames: vi.fn(() =>
      Promise.resolve({
        commonGamesCount: 0,
        commonGames: [],
        pagination: { currentPage: 1, totalPages: 0, hasNextPage: false },
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

vi.mock("../../../../../src/lib/services/libraryComparisonService", () => ({
  LibraryComparisonService: {
    getCommonGames: mockGetCommonGames,
  },
}));

import { GET } from "../../../../../src/app/api/players/[id]/common-games/route";

const CURRENT_USER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const TARGET_PLAYER_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

function makeParams(id = TARGET_PLAYER_ID): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

function mockAuthenticated(id = CURRENT_USER_ID) {
  mockGetUser.mockResolvedValue({ data: { user: { id } }, error: null });
}

function mockUnauthenticated() {
  mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
}

const SAMPLE_RESULT = {
  commonGamesCount: 2,
  commonGames: [
    {
      gameId: "game-1",
      slug: "zelda-totk",
      title: "Zelda: Tears of the Kingdom",
      coverImage: "/images/zelda.jpg",
      genres: ["Action", "Adventure"],
    },
    {
      gameId: "game-2",
      slug: "elden-ring",
      title: "Elden Ring",
      coverImage: "/images/elden.jpg",
      genres: ["RPG"],
    },
  ],
  pagination: { currentPage: 1, totalPages: 1, hasNextPage: false },
};

describe("/api/players/[id]/common-games", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockValidatePlayerId.mockReset().mockReturnValue(true);
    mockPlayerExists.mockReset().mockResolvedValue(true);
    mockGetCommonGames.mockReset().mockResolvedValue(SAMPLE_RESULT);
  });

  // Requirement 4.2 — 401 when not authenticated
  it("should return 401 when user is not authenticated", async () => {
    mockUnauthenticated();
    const req = new NextRequest(`http://localhost/api/players/${TARGET_PLAYER_ID}/common-games`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Unauthorized");
  });

  it("should return 401 when auth returns an error", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Token expired"),
    });
    const req = new NextRequest(`http://localhost/api/players/${TARGET_PLAYER_ID}/common-games`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Unauthorized");
  });

  // Requirement 4.3 — 400 for invalid UUID
  it("should return 400 when player ID is not a valid UUID", async () => {
    mockAuthenticated();
    mockValidatePlayerId.mockReturnValue(false);
    const req = new NextRequest("http://localhost/api/players/not-a-uuid/common-games");
    const res = await GET(req, makeParams("not-a-uuid"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid player ID format");
  });

  // Requirement 4.5 — 400 for self-comparison
  it("should return 400 when comparing with yourself", async () => {
    mockAuthenticated(CURRENT_USER_ID);
    const req = new NextRequest(`http://localhost/api/players/${CURRENT_USER_ID}/common-games`);
    const res = await GET(req, makeParams(CURRENT_USER_ID));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Cannot compare with yourself");
  });

  // Requirement 4.4 — 404 when target player does not exist
  it("should return 404 when target player does not exist", async () => {
    mockAuthenticated();
    mockPlayerExists.mockResolvedValue(false);
    const req = new NextRequest(`http://localhost/api/players/${TARGET_PLAYER_ID}/common-games`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Player not found");
  });

  // Requirement 4.1 — 200 success with common games
  it("should return 200 with common games on success", async () => {
    mockAuthenticated();
    const req = new NextRequest(`http://localhost/api/players/${TARGET_PLAYER_ID}/common-games`);
    const res = await GET(req, makeParams());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual(SAMPLE_RESULT);
    expect(mockGetCommonGames).toHaveBeenCalledWith(CURRENT_USER_ID, TARGET_PLAYER_ID, "fr", 1);
  });

  it("should pass locale and page query parameters", async () => {
    mockAuthenticated();
    const req = new NextRequest(
      `http://localhost/api/players/${TARGET_PLAYER_ID}/common-games?locale=en&page=3`
    );
    const res = await GET(req, makeParams());
    expect(res.status).toBe(200);
    expect(mockGetCommonGames).toHaveBeenCalledWith(CURRENT_USER_ID, TARGET_PLAYER_ID, "en", 3);
  });

  it("should default locale to fr and page to 1", async () => {
    mockAuthenticated();
    const req = new NextRequest(`http://localhost/api/players/${TARGET_PLAYER_ID}/common-games`);
    await GET(req, makeParams());
    expect(mockGetCommonGames).toHaveBeenCalledWith(CURRENT_USER_ID, TARGET_PLAYER_ID, "fr", 1);
  });

  it("should clamp page to minimum of 1", async () => {
    mockAuthenticated();
    const req = new NextRequest(
      `http://localhost/api/players/${TARGET_PLAYER_ID}/common-games?page=0`
    );
    await GET(req, makeParams());
    expect(mockGetCommonGames).toHaveBeenCalledWith(CURRENT_USER_ID, TARGET_PLAYER_ID, "fr", 1);
  });

  it("should return 500 on unexpected error", async () => {
    mockAuthenticated();
    mockGetCommonGames.mockRejectedValue(new Error("DB down"));
    const req = new NextRequest(`http://localhost/api/players/${TARGET_PLAYER_ID}/common-games`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Internal server error");
  });
});
