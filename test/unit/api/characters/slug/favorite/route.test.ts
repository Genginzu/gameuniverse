import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// vi.hoisted ensures mock fns are available when vi.mock factories run
const { mockGetUser, mockFrom, mockAddFavorite, mockRemoveFavorite } = vi.hoisted(() => ({
  mockGetUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
  mockFrom: vi.fn(() => ({})),
  mockAddFavorite: vi.fn(() => Promise.resolve()),
  mockRemoveFavorite: vi.fn(() => Promise.resolve()),
}));

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
};

vi.mock("../../../../../../src/lib/supabase-server", () => ({
  createServerClient: vi.fn(() => Promise.resolve(mockSupabase)),
  createRouteHandlerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock("../../../../../../src/lib/services/characterFavoriteService", () => ({
  CharacterFavoriteService: {
    addFavorite: mockAddFavorite,
    removeFavorite: mockRemoveFavorite,
  },
}));

import { GET, POST, DELETE } from "../../../../../../src/app/api/characters/[slug]/favorite/route";

const PARAMS = { params: Promise.resolve({ slug: "mario" }) };

function mockCharacterFound(characterId = "char-uuid-1") {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: { id: characterId }, error: null })),
  };
  mockFrom.mockReturnValue(chain);
  return chain;
}

function mockCharacterNotFound() {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: null, error: { code: "PGRST116" } })),
  };
  mockFrom.mockReturnValue(chain);
  return chain;
}

function mockAuthenticatedUser(id = "user-123") {
  mockGetUser.mockResolvedValue({ data: { user: { id } }, error: null });
}

function mockUnauthenticated() {
  mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Not authenticated") });
}

describe("/api/characters/[slug]/favorite", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockFrom.mockReset();
    mockAddFavorite.mockReset();
    mockRemoveFavorite.mockReset();
  });

  describe("POST", () => {
    it("should return 401 when not authenticated", async () => {
      mockUnauthenticated();
      const req = new NextRequest("http://localhost/api/characters/mario/favorite", {
        method: "POST",
      });
      const res = await POST(req, PARAMS);
      expect(res.status).toBe(401);
      expect((await res.json()).error).toBe("Unauthorized");
    });

    it("should return 404 when character not found", async () => {
      mockAuthenticatedUser();
      mockCharacterNotFound();
      const req = new NextRequest("http://localhost/api/characters/unknown/favorite", {
        method: "POST",
      });
      const res = await POST(req, PARAMS);
      expect(res.status).toBe(404);
      expect((await res.json()).error).toBe("Character not found");
    });

    it("should add favorite and return success", async () => {
      mockAuthenticatedUser("user-1");
      mockCharacterFound("char-1");
      mockAddFavorite.mockResolvedValue(undefined);
      const req = new NextRequest("http://localhost/api/characters/mario/favorite", {
        method: "POST",
      });
      const res = await POST(req, PARAMS);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(mockAddFavorite).toHaveBeenCalledWith("char-1", "user-1");
    });

    it("should return 409 when already favorited (23505)", async () => {
      mockAuthenticatedUser();
      mockCharacterFound("char-1");
      mockAddFavorite.mockRejectedValue({ code: "23505" });
      const req = new NextRequest("http://localhost/api/characters/mario/favorite", {
        method: "POST",
      });
      const res = await POST(req, PARAMS);
      expect(res.status).toBe(409);
      expect((await res.json()).error).toBe("Already favorited");
    });

    it("should return 500 on unexpected error", async () => {
      mockAuthenticatedUser();
      mockCharacterFound("char-1");
      mockAddFavorite.mockRejectedValue(new Error("DB down"));
      const req = new NextRequest("http://localhost/api/characters/mario/favorite", {
        method: "POST",
      });
      const res = await POST(req, PARAMS);
      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe("Internal server error");
    });
  });

  describe("DELETE", () => {
    it("should return 401 when not authenticated", async () => {
      mockUnauthenticated();
      const req = new NextRequest("http://localhost/api/characters/mario/favorite", {
        method: "DELETE",
      });
      const res = await DELETE(req, PARAMS);
      expect(res.status).toBe(401);
      expect((await res.json()).error).toBe("Unauthorized");
    });

    it("should return 404 when character not found", async () => {
      mockAuthenticatedUser();
      mockCharacterNotFound();
      const req = new NextRequest("http://localhost/api/characters/unknown/favorite", {
        method: "DELETE",
      });
      const res = await DELETE(req, PARAMS);
      expect(res.status).toBe(404);
      expect((await res.json()).error).toBe("Character not found");
    });

    it("should remove favorite and return success", async () => {
      mockAuthenticatedUser("user-1");
      mockCharacterFound("char-1");
      mockRemoveFavorite.mockResolvedValue(undefined);
      const req = new NextRequest("http://localhost/api/characters/mario/favorite", {
        method: "DELETE",
      });
      const res = await DELETE(req, PARAMS);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(mockRemoveFavorite).toHaveBeenCalledWith("char-1", "user-1");
    });

    it("should return 500 on unexpected error", async () => {
      mockAuthenticatedUser();
      mockCharacterFound("char-1");
      mockRemoveFavorite.mockRejectedValue(new Error("DB down"));
      const req = new NextRequest("http://localhost/api/characters/mario/favorite", {
        method: "DELETE",
      });
      const res = await DELETE(req, PARAMS);
      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe("Internal server error");
    });
  });

  describe("GET", () => {
    it("should return 401 when not authenticated", async () => {
      mockUnauthenticated();
      const req = new NextRequest("http://localhost/api/characters/mario/favorite");
      const res = await GET(req, PARAMS);
      expect(res.status).toBe(401);
      expect((await res.json()).error).toBe("Unauthorized");
    });

    it("should return 404 when character not found", async () => {
      mockAuthenticatedUser();
      mockCharacterNotFound();
      const req = new NextRequest("http://localhost/api/characters/unknown/favorite");
      const res = await GET(req, PARAMS);
      expect(res.status).toBe(404);
      expect((await res.json()).error).toBe("Character not found");
    });

    it("should return isFavorite true with favoritedAt when favorited", async () => {
      mockAuthenticatedUser("user-1");
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: { id: "char-1" }, error: null })),
              })),
            })),
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { created_at: "2024-06-15T12:00:00Z" },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      });

      const req = new NextRequest("http://localhost/api/characters/mario/favorite");
      const res = await GET(req, PARAMS);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.isFavorite).toBe(true);
      expect(body.favoritedAt).toBe("2024-06-15T12:00:00Z");
    });

    it("should return isFavorite false when not favorited", async () => {
      mockAuthenticatedUser("user-1");
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: { id: "char-1" }, error: null })),
              })),
            })),
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null, error: { code: "PGRST116" } })),
              })),
            })),
          })),
        };
      });

      const req = new NextRequest("http://localhost/api/characters/mario/favorite");
      const res = await GET(req, PARAMS);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.isFavorite).toBe(false);
      expect(body.favoritedAt).toBeUndefined();
    });
  });
});
