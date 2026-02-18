import { describe, it, expect, beforeEach, mock } from "bun:test";
import { NextRequest } from "next/server";

// Mock Supabase
const mockGetUser = mock(() => Promise.resolve({ data: { user: null }, error: null }));
const mockSupabase = { auth: { getUser: mockGetUser } };

mock.module("../../../../../src/lib/supabase-server", () => ({
  createServerClient: mock(() => Promise.resolve(mockSupabase)),
  createRouteHandlerClient: mock(() => Promise.resolve(mockSupabase)),
}));

// Mock service functions
const mockFetchCollections = mock(() => Promise.resolve([]));
const mockCreateCollection = mock(() => Promise.resolve({ id: "col-1", slug: "my-collection" }));

mock.module("../../../../../src/lib/services/collectionService", () => ({
  fetchCollections: mockFetchCollections,
  createCollection: mockCreateCollection,
}));

import { GET, POST } from "../../../../../src/app/api/players/[id]/collections/route";

const PLAYER_ID = "player-123";
const OTHER_USER_ID = "other-456";

function makeParams(id = PLAYER_ID): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

function mockAuthenticatedUser(id = PLAYER_ID) {
  mockGetUser.mockResolvedValue({ data: { user: { id } }, error: null });
}

function mockUnauthenticated() {
  mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
}

const SAMPLE_COLLECTIONS = [
  {
    id: "col-1",
    name: "Meilleurs RPG",
    slug: "meilleurs-rpg",
    description: "Mes RPG préférés",
    isPublic: true,
    gamesCount: 5,
    updatedAt: "2024-02-20T10:00:00Z",
    coverImages: [],
  },
];

describe("/api/players/[id]/collections", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockFetchCollections.mockReset();
    mockCreateCollection.mockReset();
  });

  describe("GET", () => {
    it("should return collections for unauthenticated user (public only)", async () => {
      mockUnauthenticated();
      mockFetchCollections.mockResolvedValue(SAMPLE_COLLECTIONS);

      const req = new NextRequest("http://localhost/api/players/player-123/collections");
      const res = await GET(req, makeParams());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.collections).toEqual(SAMPLE_COLLECTIONS);
      expect(mockFetchCollections).toHaveBeenCalledWith(PLAYER_ID, undefined, "fr");
    });

    it("should pass currentUserId when authenticated", async () => {
      mockAuthenticatedUser(PLAYER_ID);
      mockFetchCollections.mockResolvedValue(SAMPLE_COLLECTIONS);

      const req = new NextRequest("http://localhost/api/players/player-123/collections");
      const res = await GET(req, makeParams());

      expect(res.status).toBe(200);
      expect(mockFetchCollections).toHaveBeenCalledWith(PLAYER_ID, PLAYER_ID, "fr");
    });

    it("should pass locale query parameter", async () => {
      mockUnauthenticated();
      mockFetchCollections.mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/players/player-123/collections?locale=en");
      const res = await GET(req, makeParams());

      expect(res.status).toBe(200);
      expect(mockFetchCollections).toHaveBeenCalledWith(PLAYER_ID, undefined, "en");
    });

    it("should return 500 on unexpected error", async () => {
      mockUnauthenticated();
      mockFetchCollections.mockRejectedValue(new Error("DB down"));

      const req = new NextRequest("http://localhost/api/players/player-123/collections");
      const res = await GET(req, makeParams());

      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe("Internal server error");
    });
  });

  describe("POST", () => {
    it("should return 401 when not authenticated", async () => {
      mockUnauthenticated();

      const req = new NextRequest("http://localhost/api/players/player-123/collections", {
        method: "POST",
        body: JSON.stringify({ name: "Ma collection" }),
      });
      const res = await POST(req, makeParams());

      expect(res.status).toBe(401);
      expect((await res.json()).error).toBe("Unauthorized");
    });

    it("should return 403 when user is not the player", async () => {
      mockAuthenticatedUser(OTHER_USER_ID);

      const req = new NextRequest("http://localhost/api/players/player-123/collections", {
        method: "POST",
        body: JSON.stringify({ name: "Ma collection" }),
      });
      const res = await POST(req, makeParams());

      expect(res.status).toBe(403);
      expect((await res.json()).error).toBe("Forbidden");
    });

    it("should create a collection with valid input", async () => {
      mockAuthenticatedUser(PLAYER_ID);
      mockCreateCollection.mockResolvedValue({ id: "col-new", slug: "ma-collection" });

      const req = new NextRequest("http://localhost/api/players/player-123/collections", {
        method: "POST",
        body: JSON.stringify({ name: "Ma collection", description: "Une description" }),
      });
      const res = await POST(req, makeParams());
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.collection).toEqual({ id: "col-new", slug: "ma-collection" });
      expect(mockCreateCollection).toHaveBeenCalledWith(PLAYER_ID, {
        name: "Ma collection",
        description: "Une description",
        isPublic: false,
      });
    });

    it("should return 400 for invalid input (empty name)", async () => {
      mockAuthenticatedUser(PLAYER_ID);

      const req = new NextRequest("http://localhost/api/players/player-123/collections", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
      });
      const res = await POST(req, makeParams());

      expect(res.status).toBe(400);
    });

    it("should return 400 for whitespace-only name", async () => {
      mockAuthenticatedUser(PLAYER_ID);

      const req = new NextRequest("http://localhost/api/players/player-123/collections", {
        method: "POST",
        body: JSON.stringify({ name: "   " }),
      });
      const res = await POST(req, makeParams());

      expect(res.status).toBe(400);
    });

    it("should return 500 on unexpected error", async () => {
      mockAuthenticatedUser(PLAYER_ID);
      mockCreateCollection.mockRejectedValue(new Error("DB down"));

      const req = new NextRequest("http://localhost/api/players/player-123/collections", {
        method: "POST",
        body: JSON.stringify({ name: "Ma collection" }),
      });
      const res = await POST(req, makeParams());

      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe("Internal server error");
    });
  });
});
