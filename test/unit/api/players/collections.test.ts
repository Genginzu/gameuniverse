import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const PLAYER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const OTHER_USER_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

const mockCollection = {
  id: "col-1",
  name: "Best RPGs",
  slug: "best-rpgs",
  description: "My favourite RPGs",
  isPublic: true,
  gamesCount: 5,
  updatedAt: "2024-03-01T12:00:00Z",
  coverImages: ["/covers/zelda.jpg"],
  coverImageUrl: null,
};

const mockPrivateCollection = {
  ...mockCollection,
  id: "col-2",
  name: "Secret list",
  slug: "secret-list",
  isPublic: false,
};

const mockStats = {
  totalCollections: 2,
  totalGames: 10,
  largestCollection: "Best RPGs",
};

const {
  mockGetUser,
  mockValidatePlayerId,
  mockPlayerExists,
  mockFetchPlayerCollections,
  mockFetchPlayerCollectionsStats,
  mockFetchCollections,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
  mockValidatePlayerId: vi.fn(() => true),
  mockPlayerExists: vi.fn(() => Promise.resolve(true)),
  mockFetchPlayerCollections: vi.fn(() => Promise.resolve({ collections: [], totalCount: 0 })),
  mockFetchPlayerCollectionsStats: vi.fn(() =>
    Promise.resolve({ totalCollections: 0, totalGames: 0, largestCollection: null })
  ),
  mockFetchCollections: vi.fn(() => Promise.resolve([])),
}));

const mockSupabase = { auth: { getUser: mockGetUser } };

vi.mock("../../../../src/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock("../../../../src/lib/services/playerService", () => ({
  PlayerService: {
    validatePlayerId: mockValidatePlayerId,
    playerExists: mockPlayerExists,
  },
}));

vi.mock("../../../../src/lib/services/playerCollectionsServerService", () => ({
  PlayerCollectionsServerService: {
    fetchPlayerCollections: mockFetchPlayerCollections,
    fetchPlayerCollectionsStats: mockFetchPlayerCollectionsStats,
  },
}));

vi.mock("../../../../src/lib/services/collectionService", () => ({
  fetchCollections: mockFetchCollections,
  createCollection: vi.fn(),
}));

vi.mock("../../../../src/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from "../../../../src/app/api/players/[id]/collections/route";

function makeParams(id = PLAYER_ID): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

function makeUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(path, "http://localhost");
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

describe("GET /api/players/[id]/collections", () => {
  beforeEach(() => {
    mockGetUser.mockReset().mockResolvedValue({ data: { user: null }, error: null });
    mockValidatePlayerId.mockReset().mockReturnValue(true);
    mockPlayerExists.mockReset().mockResolvedValue(true);
    mockFetchPlayerCollections.mockReset().mockResolvedValue({
      collections: [mockCollection],
      totalCount: 1,
    });
    mockFetchPlayerCollectionsStats.mockReset().mockResolvedValue(mockStats);
    mockFetchCollections.mockReset().mockResolvedValue([]);
  });

  describe("paginated mode (with page param)", () => {
    it("returns collections with stats and pagination for page 1", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: OTHER_USER_ID } }, error: null });
      mockFetchPlayerCollections.mockResolvedValue({
        collections: [mockCollection],
        totalCount: 1,
      });
      mockFetchPlayerCollectionsStats.mockResolvedValue(mockStats);

      const req = new NextRequest(makeUrl(`/api/players/${PLAYER_ID}/collections`, { page: "1" }));
      const res = await GET(req, makeParams());

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.collections).toHaveLength(1);
      expect(body.collections[0].id).toBe("col-1");
      expect(body.stats).toEqual(mockStats);
      expect(body.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalCollections: 1,
        hasNextPage: false,
      });
    });

    it("returns 404 for non-existent player", async () => {
      mockPlayerExists.mockResolvedValue(false);

      const req = new NextRequest(makeUrl(`/api/players/${PLAYER_ID}/collections`, { page: "1" }));
      const res = await GET(req, makeParams());

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("Player not found");
    });

    it("returns 400 for invalid UUID", async () => {
      mockValidatePlayerId.mockReturnValue(false);

      const req = new NextRequest(makeUrl("/api/players/not-a-uuid/collections", { page: "1" }));
      const res = await GET(req, makeParams("not-a-uuid"));

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Format d'identifiant invalide");
    });

    it("falls back to default sort for invalid sort param", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: OTHER_USER_ID } }, error: null });

      const req = new NextRequest(
        makeUrl(`/api/players/${PLAYER_ID}/collections`, { page: "1", sort: "invalid_sort" })
      );
      await GET(req, makeParams());

      // Should call with "updated_at_desc" (default) instead of "invalid_sort"
      expect(mockFetchPlayerCollections).toHaveBeenCalledWith(
        PLAYER_ID,
        false,
        "updated_at_desc",
        1
      );
    });

    it("returns all collections (public + private) for owner", async () => {
      // Authenticated as the player themselves
      mockGetUser.mockResolvedValue({ data: { user: { id: PLAYER_ID } }, error: null });
      mockFetchPlayerCollections.mockResolvedValue({
        collections: [mockCollection, mockPrivateCollection],
        totalCount: 2,
      });

      const req = new NextRequest(makeUrl(`/api/players/${PLAYER_ID}/collections`, { page: "1" }));
      await GET(req, makeParams());

      // isOwner should be true
      expect(mockFetchPlayerCollections).toHaveBeenCalledWith(
        PLAYER_ID,
        true,
        "updated_at_desc",
        1
      );
      expect(mockFetchPlayerCollectionsStats).toHaveBeenCalledWith(PLAYER_ID, true);
    });

    it("returns only public collections for visitor", async () => {
      // Authenticated as a different user
      mockGetUser.mockResolvedValue({ data: { user: { id: OTHER_USER_ID } }, error: null });

      const req = new NextRequest(makeUrl(`/api/players/${PLAYER_ID}/collections`, { page: "1" }));
      await GET(req, makeParams());

      // isOwner should be false
      expect(mockFetchPlayerCollections).toHaveBeenCalledWith(
        PLAYER_ID,
        false,
        "updated_at_desc",
        1
      );
      expect(mockFetchPlayerCollectionsStats).toHaveBeenCalledWith(PLAYER_ID, false);
    });

    it("returns 500 on server error", async () => {
      mockFetchPlayerCollections.mockRejectedValue(new Error("DB down"));

      const req = new NextRequest(makeUrl(`/api/players/${PLAYER_ID}/collections`, { page: "1" }));
      const res = await GET(req, makeParams());

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Internal server error");
    });
  });

  describe("legacy mode (without page param)", () => {
    it("returns collections via fetchCollections for backward compatibility", async () => {
      const legacyCollections = [{ id: "col-legacy", name: "Legacy" }];
      mockFetchCollections.mockResolvedValue(legacyCollections);
      mockGetUser.mockResolvedValue({ data: { user: { id: PLAYER_ID } }, error: null });

      const req = new NextRequest(makeUrl(`/api/players/${PLAYER_ID}/collections`));
      const res = await GET(req, makeParams());

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.collections).toEqual(legacyCollections);
      expect(mockFetchCollections).toHaveBeenCalledWith(PLAYER_ID, PLAYER_ID, "fr");
      // Should NOT call the paginated service
      expect(mockFetchPlayerCollections).not.toHaveBeenCalled();
      expect(mockFetchPlayerCollectionsStats).not.toHaveBeenCalled();
    });
  });
});
