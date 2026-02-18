import { describe, it, expect, beforeEach, mock } from "bun:test";
import { NextRequest } from "next/server";

// Create mock functions for Supabase
const mockGetUser = mock(() => Promise.resolve({ data: { user: null }, error: null }));
const mockFrom = mock(() => ({}));

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
};

// Create mock functions for CharacterFavoriteService
const mockAddFavorite = mock(() => Promise.resolve());
const mockRemoveFavorite = mock(() => Promise.resolve());

mock.module("../../../../../../src/lib/supabase-server", () => ({
  createServerClient: mock(() => Promise.resolve(mockSupabase)),
  createRouteHandlerClient: mock(() => Promise.resolve(mockSupabase)),
}));

mock.module("../../../../../../src/lib/services/characterFavoriteService", () => ({
  CharacterFavoriteService: {
    addFavorite: mockAddFavorite,
    removeFavorite: mockRemoveFavorite,
  },
}));

import { GET, POST, DELETE } from "../../../../../../src/app/api/characters/[slug]/favorite/route";

const PARAMS = { params: Promise.resolve({ slug: "mario" }) };

/** Helper: configure mockFrom to resolve a character by slug. */
function mockCharacterFound(characterId = "char-uuid-1") {
  const chain = {
    select: mock(() => chain),
    eq: mock(() => chain),
    single: mock(() => Promise.resolve({ data: { id: characterId }, error: null })),
  };
  mockFrom.mockReturnValue(chain);
  return chain;
}

/** Helper: configure mockFrom so the character lookup returns nothing. */
function mockCharacterNotFound() {
  const chain = {
    select: mock(() => chain),
    eq: mock(() => chain),
    single: mock(() => Promise.resolve({ data: null, error: { code: "PGRST116" } })),
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

  // ── POST ──────────────────────────────────────────────────────────────

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

  // ── DELETE ────────────────────────────────────────────────────────────

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

  // ── GET ───────────────────────────────────────────────────────────────

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

      // First call: character lookup; second call: favorites query
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // resolveCharacterId
          return {
            select: mock(() => ({
              eq: mock(() => ({
                single: mock(() => Promise.resolve({ data: { id: "char-1" }, error: null })),
              })),
            })),
          };
        }
        // favorites query
        return {
          select: mock(() => ({
            eq: mock(() => ({
              eq: mock(() => ({
                single: mock(() =>
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
            select: mock(() => ({
              eq: mock(() => ({
                single: mock(() => Promise.resolve({ data: { id: "char-1" }, error: null })),
              })),
            })),
          };
        }
        return {
          select: mock(() => ({
            eq: mock(() => ({
              eq: mock(() => ({
                single: mock(() =>
                  Promise.resolve({
                    data: null,
                    error: { code: "PGRST116" },
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
      expect(body.isFavorite).toBe(false);
      expect(body.favoritedAt).toBeUndefined();
    });
  });
});
