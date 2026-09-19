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

import { GroupServerService, generateSlug } from "@/lib/services/groupServerService";

const OWNER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

describe("generateSlug", () => {
  it("lowercases and replaces spaces with dashes", () => {
    expect(generateSlug("RPG Fans Club")).toBe("rpg-fans-club");
  });

  it("strips accents and diacritics", () => {
    expect(generateSlug("Éléphant Rosé")).toBe("elephant-rose");
  });

  it("falls back to 'group' for an empty-after-strip input", () => {
    expect(generateSlug("!!!")).toBe("group");
  });
});

describe("GroupServerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resultQueue = [];
  });

  describe("fetchMyGroups", () => {
    it("returns groups the player belongs to, sorted alphabetically by the server", async () => {
      resultQueue = [
        { data: [{ group_id: "g1" }, { group_id: "g2" }], error: null },
        {
          data: [
            {
              id: "g1",
              name: "Alpha Guild",
              slug: "alpha-guild",
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
              group_members: [{ id: "m1" }],
            },
          ],
          error: null,
        },
      ];

      const groups = await GroupServerService.fetchMyGroups(OWNER_ID);

      expect(groups).toHaveLength(1);
      expect(groups[0].slug).toBe("alpha-guild");
      expect(mockFrom).toHaveBeenCalledWith("group_members");
      expect(mockFrom).toHaveBeenCalledWith("groups");
    });

    it("returns an empty list without querying groups when the player has no membership", async () => {
      resultQueue = [{ data: [], error: null }];

      const groups = await GroupServerService.fetchMyGroups(OWNER_ID);

      expect(groups).toEqual([]);
    });

    it("returns an empty list when the group_members table is missing (PGRST205)", async () => {
      resultQueue = [{ data: null, error: { code: "PGRST205" } }];

      const groups = await GroupServerService.fetchMyGroups(OWNER_ID);

      expect(groups).toEqual([]);
    });

    it("throws on an unexpected error fetching memberships", async () => {
      resultQueue = [{ data: null, error: { code: "XX000", message: "boom" } }];

      await expect(GroupServerService.fetchMyGroups(OWNER_ID)).rejects.toThrow("boom");
    });
  });

  describe("generateUniqueSlug", () => {
    it("returns the base slug when it is not taken", async () => {
      resultQueue = [{ data: null, error: null }];

      const slug = await GroupServerService.generateUniqueSlug("RPG Fans");

      expect(slug).toBe("rpg-fans");
    });

    it("appends a numeric suffix when the base slug is taken", async () => {
      resultQueue = [
        { data: { id: "existing" }, error: null }, // "rpg-fans" taken
        { data: null, error: null }, // "rpg-fans-2" free
      ];

      const slug = await GroupServerService.generateUniqueSlug("RPG Fans");

      expect(slug).toBe("rpg-fans-2");
    });
  });

  describe("searchGroups", () => {
    it("returns groups mapped from rows with total count", async () => {
      resultQueue = [
        {
          data: [
            {
              id: "g1",
              name: "RPG Fans",
              slug: "rpg-fans",
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
              group_members: [{ id: "m1" }, { id: "m2" }],
            },
          ],
          error: null,
          count: 1,
        },
      ];

      const { groups, totalCount } = await GroupServerService.searchGroups({});

      expect(totalCount).toBe(1);
      expect(groups).toEqual([
        {
          id: "g1",
          name: "RPG Fans",
          slug: "rpg-fans",
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

      const result = await GroupServerService.searchGroups({});

      expect(result).toEqual({ groups: [], totalCount: 0 });
    });

    it("throws on an unexpected error", async () => {
      resultQueue = [{ data: null, error: { code: "XX000", message: "boom" }, count: null }];

      await expect(GroupServerService.searchGroups({})).rejects.toThrow("boom");
    });
  });

  describe("getGroupAccess", () => {
    it("returns id/visibility/ownerId when the group exists", async () => {
      resultQueue = [
        { data: { id: "g1", visibility: "private", owner_id: OWNER_ID }, error: null },
      ];

      const access = await GroupServerService.getGroupAccess("rpg-fans");

      expect(access).toEqual({ id: "g1", visibility: "private", ownerId: OWNER_ID });
    });

    it("returns null when the group does not exist", async () => {
      resultQueue = [{ data: null, error: null }];

      const access = await GroupServerService.getGroupAccess("missing-slug");

      expect(access).toBeNull();
    });
  });

  describe("deleteGroup", () => {
    it("deletes the group by slug", async () => {
      resultQueue = [{ error: null }];

      await expect(GroupServerService.deleteGroup("rpg-fans")).resolves.toBeUndefined();
      expect(mockFrom).toHaveBeenCalledWith("groups");
    });

    it("throws when the delete fails", async () => {
      resultQueue = [{ error: { message: "not allowed" } }];

      await expect(GroupServerService.deleteGroup("rpg-fans")).rejects.toThrow("not allowed");
    });
  });
});
