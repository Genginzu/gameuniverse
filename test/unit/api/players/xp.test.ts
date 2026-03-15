import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import type { PlayerXpStats } from "@/types/achievement";

const PLAYER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

const mockXpStats: PlayerXpStats = {
  xpTotal: 150,
  level: 4,
  currentLevelXp: 100,
  nextLevelXp: 178,
  progressPercent: 64,
};

const { mockValidatePlayerId, mockPlayerExists, mockFetchPlayerXp } = vi.hoisted(() => ({
  mockValidatePlayerId: vi.fn(() => true),
  mockPlayerExists: vi.fn(() => Promise.resolve(true)),
  mockFetchPlayerXp: vi.fn(() => Promise.resolve(mockXpStats)),
}));

vi.mock("../../../../src/lib/services/playerService", () => ({
  PlayerService: {
    validatePlayerId: mockValidatePlayerId,
    playerExists: mockPlayerExists,
  },
}));

vi.mock("../../../../src/lib/services/achievementService", () => ({
  AchievementService: {
    fetchPlayerXp: mockFetchPlayerXp,
  },
}));

vi.mock("../../../../src/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from "../../../../src/app/api/players/[id]/xp/route";

function makeParams(id = PLAYER_ID): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe("/api/players/[id]/xp", () => {
  beforeEach(() => {
    mockValidatePlayerId.mockReset().mockReturnValue(true);
    mockPlayerExists.mockReset().mockResolvedValue(true);
    mockFetchPlayerXp.mockReset().mockResolvedValue(mockXpStats);
  });

  it("should return 200 with XP stats on success", async () => {
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/xp`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.xpTotal).toBe(150);
    expect(body.level).toBe(4);
    expect(body.currentLevelXp).toBe(100);
    expect(body.nextLevelXp).toBe(178);
    expect(body.progressPercent).toBe(64);
  });

  it("should call fetchPlayerXp with the correct player ID", async () => {
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/xp`);
    await GET(req, makeParams());
    expect(mockFetchPlayerXp).toHaveBeenCalledWith(PLAYER_ID);
  });

  it("should return 400 for invalid UUID", async () => {
    mockValidatePlayerId.mockReturnValue(false);
    const req = new NextRequest("http://localhost/api/players/not-a-uuid/xp");
    const res = await GET(req, makeParams("not-a-uuid"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid player ID format");
  });

  it("should return 404 when player does not exist", async () => {
    mockPlayerExists.mockResolvedValue(false);
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/xp`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Player not found");
  });

  it("should return 500 on unexpected error", async () => {
    mockFetchPlayerXp.mockRejectedValue(new Error("DB down"));
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/xp`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });
});
