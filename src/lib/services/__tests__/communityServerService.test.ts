import { describe, it, expect, beforeEach, vi } from "vitest";

let resultQueue: Array<{ data?: unknown; error?: unknown; count?: number | null }>;

function nextResult() {
  return resultQueue.shift() ?? { data: null, error: null, count: 0 };
}

function makeBuilder() {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = vi.fn(chain);
  builder.eq = vi.fn(chain);
  builder.ilike = vi.fn(chain);
  builder.in = vi.fn(chain);
  builder.order = vi.fn(chain);
  builder.range = vi.fn(() => Promise.resolve(nextResult()));
  builder.maybeSingle = vi.fn(() => Promise.resolve(nextResult()));
  builder.single = vi.fn(() => Promise.resolve(nextResult()));
  builder.insert = vi.fn(chain);
  builder.update = vi.fn(chain);
  builder.delete = vi.fn(chain);
  builder.then = (resolve: (v: unknown) => unknown) => resolve(nextResult());
  return builder;
}

const mockFrom = vi.fn(() => makeBuilder());

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom })),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { CommunityServerService, generateSlug } from "@/lib/services/communityServerService";

const OWNER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

describe("generateSlug", () => {
  it("lowercases and replaces spaces with dashes", () => {
    expect(generateSlug("RPG Community Hub")).toBe("rpg-community-hub");
  });

  it("strips accents and diacritics", () => {
    expect(generateSlug("Éléphant Rosé")).toBe("elephant-rose");
  });

  it("falls back to 'community' for an empty-after-strip input", () => {
    expect(generateSlug("!!!")).toBe("community");
  });
});

describe("CommunityServerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resultQueue = [];
  });

  describe("fetchMyCommunities", () => {
    it("returns communities the player belongs to, sorted alphabetically by the server", async () => {
      resultQueue = [
        { data: [{ community_id: "c1" }, { community_id: "c2" }], error: null },
        {
          data: [
            {
              id: "c1",
              name: "Alpha Community",
              slug: "alpha-community",
              description: null,
              image_url: null,
              visibility: "public",
              game_id: null,
              genre_id: null,
              owner_id: OWNER_ID,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
              games: null,
              genres: null,
              community_members: [{ id: "m1" }],
            },
          ],
          error: null,
        },
      ];

      const communities = await CommunityServerService.fetchMyCommunities(OWNER_ID);

      expect(communities).toHaveLength(1);
      expect(communities[0].slug).toBe("alpha-community");
      expect(mockFrom).toHaveBeenCalledWith("community_members");
      expect(mockFrom).toHaveBeenCalledWith("communities");
    });

    it("returns an empty list without querying communities when the player has no membership", async () => {
      resultQueue = [{ data: [], error: null }];

      const communities = await CommunityServerService.fetchMyCommunities(OWNER_ID);

      expect(communities).toEqual([]);
    });

    it("returns an empty list when the community_members table is missing (PGRST205)", async () => {
      resultQueue = [{ data: null, error: { code: "PGRST205" } }];

      const communities = await CommunityServerService.fetchMyCommunities(OWNER_ID);

      expect(communities).toEqual([]);
    });

    it("throws on an unexpected error fetching memberships", async () => {
      resultQueue = [{ data: null, error: { code: "XX000", message: "boom" } }];

      await expect(CommunityServerService.fetchMyCommunities(OWNER_ID)).rejects.toThrow("boom");
    });
  });

  describe("generateUniqueSlug", () => {
    it("returns the base slug when it is not taken", async () => {
      resultQueue = [{ data: null, error: null }];

      const slug = await CommunityServerService.generateUniqueSlug("RPG Community");

      expect(slug).toBe("rpg-community");
    });

    it("appends a numeric suffix when the base slug is taken", async () => {
      resultQueue = [
        { data: { id: "existing" }, error: null },
        { data: null, error: null },
      ];

      const slug = await CommunityServerService.generateUniqueSlug("RPG Community");

      expect(slug).toBe("rpg-community-2");
    });
  });

  describe("searchCommunities", () => {
    it("returns communities mapped from rows with total count", async () => {
      resultQueue = [
        {
          data: [
            {
              id: "c1",
              name: "RPG Community",
              slug: "rpg-community",
              description: null,
              image_url: null,
              visibility: "public",
              game_id: null,
              genre_id: null,
              owner_id: OWNER_ID,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
              games: null,
              genres: { genre_translations: [{ name: "RPG" }] },
              community_members: [{ id: "m1" }, { id: "m2" }],
            },
          ],
          error: null,
          count: 1,
        },
      ];

      const { communities, totalCount } = await CommunityServerService.searchCommunities({});

      expect(totalCount).toBe(1);
      expect(communities).toEqual([
        {
          id: "c1",
          name: "RPG Community",
          slug: "rpg-community",
          description: null,
          imageUrl: null,
          visibility: "public",
          gameId: null,
          genreId: null,
          gameName: null,
          genreName: "RPG",
          membersCount: 2,
          ownerId: OWNER_ID,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ]);
    });

    it("returns an empty result when the table is missing (PGRST205)", async () => {
      resultQueue = [{ data: null, error: { code: "PGRST205" }, count: null }];

      const result = await CommunityServerService.searchCommunities({});

      expect(result).toEqual({ communities: [], totalCount: 0 });
    });

    it("throws on an unexpected error", async () => {
      resultQueue = [{ data: null, error: { code: "XX000", message: "boom" }, count: null }];

      await expect(CommunityServerService.searchCommunities({})).rejects.toThrow("boom");
    });
  });

  describe("getCommunityAccess", () => {
    it("returns id/visibility/ownerId when the community exists", async () => {
      resultQueue = [
        { data: { id: "c1", visibility: "private", owner_id: OWNER_ID }, error: null },
      ];

      const access = await CommunityServerService.getCommunityAccess("rpg-community");

      expect(access).toEqual({ id: "c1", visibility: "private", ownerId: OWNER_ID });
    });

    it("returns null when the community does not exist", async () => {
      resultQueue = [{ data: null, error: null }];

      const access = await CommunityServerService.getCommunityAccess("missing-slug");

      expect(access).toBeNull();
    });
  });

  describe("deleteCommunity", () => {
    it("deletes the community by slug", async () => {
      resultQueue = [{ error: null }];

      await expect(
        CommunityServerService.deleteCommunity("rpg-community")
      ).resolves.toBeUndefined();
      expect(mockFrom).toHaveBeenCalledWith("communities");
    });

    it("throws when the delete fails", async () => {
      resultQueue = [{ error: { message: "not allowed" } }];

      await expect(CommunityServerService.deleteCommunity("rpg-community")).rejects.toThrow(
        "not allowed"
      );
    });
  });
});
