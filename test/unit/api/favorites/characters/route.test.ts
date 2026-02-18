import { describe, it, expect, beforeEach, mock } from "bun:test";
import { NextRequest } from "next/server";

// Create mock functions for Supabase
const mockGetUser = mock(() => Promise.resolve({ data: { user: null }, error: null }));

const mockSupabase = {
  auth: { getUser: mockGetUser },
};

// Create mock function for CharacterFavoriteService.getUserFavorites
const mockGetUserFavorites = mock(() => Promise.resolve([]));

mock.module("../../../../../src/lib/supabase-server", () => ({
  createServerClient: mock(() => Promise.resolve(mockSupabase)),
  createRouteHandlerClient: mock(() => Promise.resolve(mockSupabase)),
}));

mock.module("../../../../../src/lib/services/characterFavoriteService", () => ({
  CharacterFavoriteService: {
    getUserFavorites: mockGetUserFavorites,
  },
}));

import { GET } from "../../../../../src/app/api/favorites/characters/route";

function mockAuthenticatedUser(id = "user-123") {
  mockGetUser.mockResolvedValue({ data: { user: { id } }, error: null });
}

function mockUnauthenticated() {
  mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Not authenticated") });
}

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

describe("/api/favorites/characters", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockGetUserFavorites.mockReset();
  });

  describe("GET", () => {
    it("should return 401 when not authenticated", async () => {
      mockUnauthenticated();

      const req = new NextRequest("http://localhost/api/favorites/characters");
      const res = await GET(req);

      expect(res.status).toBe(401);
      expect((await res.json()).error).toBe("Unauthorized");
    });

    it("should return user favorites with default locale", async () => {
      mockAuthenticatedUser("user-1");
      mockGetUserFavorites.mockResolvedValue(SAMPLE_FAVORITES);

      const req = new NextRequest("http://localhost/api/favorites/characters");
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.characters).toEqual(SAMPLE_FAVORITES);
      expect(mockGetUserFavorites).toHaveBeenCalledWith("user-1", "fr");
    });

    it("should pass locale query parameter to service", async () => {
      mockAuthenticatedUser("user-1");
      mockGetUserFavorites.mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/favorites/characters?locale=en");
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(mockGetUserFavorites).toHaveBeenCalledWith("user-1", "en");
    });

    it("should return empty array when user has no favorites", async () => {
      mockAuthenticatedUser("user-1");
      mockGetUserFavorites.mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/favorites/characters");
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.characters).toEqual([]);
    });

    it("should return 500 on unexpected error", async () => {
      mockAuthenticatedUser("user-1");
      mockGetUserFavorites.mockRejectedValue(new Error("DB down"));

      const req = new NextRequest("http://localhost/api/favorites/characters");
      const res = await GET(req);

      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe("Internal server error");
    });
  });
});
