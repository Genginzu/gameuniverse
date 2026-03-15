import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const PLAYER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

const mockAchievements = [
  {
    key: "library_1",
    category: "library",
    tier: "bronze",
    threshold: 1,
    xpValue: 10,
    icon: "BookOpen",
    name: "Premier jeu",
    description: "Ajoutez votre premier jeu",
    unlockedAt: "2024-03-01T12:00:00Z",
    sortOrder: 1,
  },
  {
    key: "library_5",
    category: "library",
    tier: "bronze",
    threshold: 5,
    xpValue: 25,
    icon: "BookOpen",
    name: "Collectionneur débutant",
    description: "Ajoutez 5 jeux",
    unlockedAt: null,
    sortOrder: 2,
  },
];

const { mockValidatePlayerId, mockPlayerExists, mockFetchPlayerAchievements } = vi.hoisted(() => ({
  mockValidatePlayerId: vi.fn(() => true),
  mockPlayerExists: vi.fn(() => Promise.resolve(true)),
  mockFetchPlayerAchievements: vi.fn(() => Promise.resolve(mockAchievements)),
}));

vi.mock("../../../../src/lib/services/playerService", () => ({
  PlayerService: {
    validatePlayerId: mockValidatePlayerId,
    playerExists: mockPlayerExists,
  },
}));

vi.mock("../../../../src/lib/services/achievementService", () => ({
  AchievementService: {
    fetchPlayerAchievements: mockFetchPlayerAchievements,
  },
}));

vi.mock("../../../../src/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from "../../../../src/app/api/players/[id]/achievements/route";

function makeParams(id = PLAYER_ID): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe("/api/players/[id]/achievements", () => {
  beforeEach(() => {
    mockValidatePlayerId.mockReset().mockReturnValue(true);
    mockPlayerExists.mockReset().mockResolvedValue(true);
    mockFetchPlayerAchievements.mockReset().mockResolvedValue(mockAchievements);
  });

  it("should return 200 with achievements on success", async () => {
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/achievements?locale=fr`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.achievements).toHaveLength(2);
    expect(body.achievements[0].key).toBe("library_1");
    expect(body.achievements[0].unlockedAt).toBe("2024-03-01T12:00:00Z");
    expect(body.achievements[1].unlockedAt).toBeNull();
  });

  it("should pass locale query param to the service", async () => {
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/achievements?locale=en`);
    await GET(req, makeParams());
    expect(mockFetchPlayerAchievements).toHaveBeenCalledWith(PLAYER_ID, "en");
  });

  it("should default locale to fr when not provided", async () => {
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/achievements`);
    await GET(req, makeParams());
    expect(mockFetchPlayerAchievements).toHaveBeenCalledWith(PLAYER_ID, "fr");
  });

  it("should return 400 for invalid UUID", async () => {
    mockValidatePlayerId.mockReturnValue(false);
    const req = new NextRequest("http://localhost/api/players/not-a-uuid/achievements");
    const res = await GET(req, makeParams("not-a-uuid"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid player ID format");
  });

  it("should return 404 when player does not exist", async () => {
    mockPlayerExists.mockResolvedValue(false);
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/achievements`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Player not found");
  });

  it("should return 500 on unexpected error", async () => {
    mockFetchPlayerAchievements.mockRejectedValue(new Error("DB down"));
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/achievements`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });
});
