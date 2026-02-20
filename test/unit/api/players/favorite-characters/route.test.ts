import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// vi.hoisted ensures mock fns are available when vi.mock factories run
const { mockGetPlayerFavorites } = vi.hoisted(() => ({
  mockGetPlayerFavorites: vi.fn(() => Promise.resolve([])),
}));

vi.mock("../../../../../src/lib/services/characterFavoriteService", () => ({
  CharacterFavoriteService: {
    getPlayerFavorites: mockGetPlayerFavorites,
  },
}));

import { GET } from "../../../../../src/app/api/players/[id]/favorite-characters/route";

const PARAMS = { params: Promise.resolve({ id: "player-123" }) };

const SAMPLE_FAVORITES = [
  {
    id: "char-1",
    slug: "mario",
    name: "Mario",
    role: "Protagonist",
    mainImage: "/images/mario.png",
    backgroundColor: "#ff0000",
    primaryGame: "Super Mario Bros.",
    favoritedAt: "2024-06-15T12:00:00Z",
  },
  {
    id: "char-2",
    slug: "link",
    name: "Link",
    role: "Hero",
    mainImage: "/images/link.png",
    backgroundColor: "#00ff00",
    primaryGame: "The Legend of Zelda",
    favoritedAt: "2024-06-14T10:00:00Z",
  },
];

describe("/api/players/[id]/favorite-characters", () => {
  beforeEach(() => {
    mockGetPlayerFavorites.mockReset();
  });

  describe("GET", () => {
    it("should return player favorites with default locale", async () => {
      mockGetPlayerFavorites.mockResolvedValue(SAMPLE_FAVORITES);
      const req = new NextRequest("http://localhost/api/players/player-123/favorite-characters");
      const res = await GET(req, PARAMS);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.characters).toEqual(SAMPLE_FAVORITES);
      expect(mockGetPlayerFavorites).toHaveBeenCalledWith("player-123", "fr");
    });

    it("should pass locale query parameter to service", async () => {
      mockGetPlayerFavorites.mockResolvedValue([]);
      const req = new NextRequest(
        "http://localhost/api/players/player-123/favorite-characters?locale=en"
      );
      const res = await GET(req, PARAMS);
      expect(res.status).toBe(200);
      expect(mockGetPlayerFavorites).toHaveBeenCalledWith("player-123", "en");
    });

    it("should return empty array when player has no favorites", async () => {
      mockGetPlayerFavorites.mockResolvedValue([]);
      const req = new NextRequest("http://localhost/api/players/player-123/favorite-characters");
      const res = await GET(req, PARAMS);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.characters).toEqual([]);
    });

    it("should return 500 on unexpected error", async () => {
      mockGetPlayerFavorites.mockRejectedValue(new Error("DB down"));
      const req = new NextRequest("http://localhost/api/players/player-123/favorite-characters");
      const res = await GET(req, PARAMS);
      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe("Internal server error");
    });
  });
});
