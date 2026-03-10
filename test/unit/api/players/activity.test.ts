import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const PLAYER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

const { mockValidatePlayerId, mockPlayerExists, mockFetchPlayerActivity } = vi.hoisted(() => ({
  mockValidatePlayerId: vi.fn(() => true),
  mockPlayerExists: vi.fn(() => Promise.resolve(true)),
  mockFetchPlayerActivity: vi.fn(() =>
    Promise.resolve({
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
    })
  ),
}));

vi.mock("../../../../src/lib/services/playerService", () => ({
  PlayerService: {
    validatePlayerId: mockValidatePlayerId,
    playerExists: mockPlayerExists,
  },
}));

vi.mock("../../../../src/lib/services/activityServerService", () => ({
  ActivityServerService: {
    fetchPlayerActivity: mockFetchPlayerActivity,
  },
}));

vi.mock("../../../../src/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from "../../../../src/app/api/players/[id]/activity/route";

function makeParams(id = PLAYER_ID): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe("/api/players/[id]/activity", () => {
  beforeEach(() => {
    mockValidatePlayerId.mockReset().mockReturnValue(true);
    mockPlayerExists.mockReset().mockResolvedValue(true);
    mockFetchPlayerActivity.mockReset().mockResolvedValue({
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
    });
  });

  it("should return 200 with activity events on success", async () => {
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/activity`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.events).toHaveLength(1);
    expect(body.events[0].type).toBe("review");
    expect(body.pagination.currentPage).toBe(1);
  });

  it("should return 400 for invalid UUID", async () => {
    mockValidatePlayerId.mockReturnValue(false);
    const req = new NextRequest("http://localhost/api/players/not-a-uuid/activity");
    const res = await GET(req, makeParams("not-a-uuid"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Format d'identifiant invalide");
  });

  it("should return 404 for non-existent player", async () => {
    mockPlayerExists.mockResolvedValue(false);
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/activity`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Player not found");
  });

  it("should return 500 on unexpected error", async () => {
    mockFetchPlayerActivity.mockRejectedValue(new Error("DB down"));
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/activity`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });

  it("should default page to 1 and locale to fr", async () => {
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/activity`);
    await GET(req, makeParams());
    expect(mockFetchPlayerActivity).toHaveBeenCalledWith(PLAYER_ID, "fr", undefined, 1);
  });

  it("should pass page and type query parameters", async () => {
    const req = new NextRequest(
      `http://localhost/api/players/${PLAYER_ID}/activity?page=3&type=friendship&locale=en`
    );
    await GET(req, makeParams());
    expect(mockFetchPlayerActivity).toHaveBeenCalledWith(PLAYER_ID, "en", "friendship", 3);
  });

  it("should ignore invalid type filter and pass undefined", async () => {
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/activity?type=invalid`);
    await GET(req, makeParams());
    expect(mockFetchPlayerActivity).toHaveBeenCalledWith(PLAYER_ID, "fr", undefined, 1);
  });

  it("should normalize invalid page to 1", async () => {
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/activity?page=-5`);
    await GET(req, makeParams());
    expect(mockFetchPlayerActivity).toHaveBeenCalledWith(PLAYER_ID, "fr", undefined, 1);
  });
});
