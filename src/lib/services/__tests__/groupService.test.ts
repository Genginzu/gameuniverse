import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GroupService, buildGroupsUrl } from "@/lib/services/groupService";
import type { GroupDetail, GroupListResponse, GroupMember, GroupPost } from "@/types/group";

const mockFetch = vi.fn<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>();

const GROUP_SLUG = "rpg-fans";
const PLAYER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

const SAMPLE_GROUP: GroupDetail = {
  id: "gggggggg-gggg-4ggg-gggg-gggggggggggg",
  name: "RPG Fans",
  slug: GROUP_SLUG,
  description: "A group for RPG lovers",
  imageUrl: null,
  visibility: "public",
  gameId: null,
  genreId: null,
  gameName: null,
  genreName: "RPG",
  membersCount: 3,
  ownerId: PLAYER_ID,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  owner: { id: PLAYER_ID, username: "OwnerName", avatarUrl: null },
  viewerRole: "owner",
};

const SAMPLE_LIST_RESPONSE: GroupListResponse = {
  groups: [SAMPLE_GROUP],
  pagination: { currentPage: 1, totalPages: 1, totalCount: 1, hasNextPage: false },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("buildGroupsUrl", () => {
  it("returns base URL when no params provided", () => {
    expect(buildGroupsUrl({})).toBe("/api/groups");
  });

  it("includes search, gameId, genreId, page params", () => {
    const url = buildGroupsUrl({ search: "rpg", gameId: "g1", genreId: "gen1", page: 2 });
    expect(url).toContain("search=rpg");
    expect(url).toContain("gameId=g1");
    expect(url).toContain("genreId=gen1");
    expect(url).toContain("page=2");
  });
});

describe("GroupService", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  describe("fetchGroups", () => {
    it("returns the list response on success", async () => {
      mockFetch.mockResolvedValue(jsonResponse(SAMPLE_LIST_RESPONSE));

      const result = await GroupService.fetchGroups({ search: "rpg" });

      expect(result).toEqual(SAMPLE_LIST_RESPONSE);
      expect(mockFetch).toHaveBeenCalledWith("/api/groups?search=rpg");
    });

    it("throws with the server error message on failure", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ error: "Bad request" }, 400));

      await expect(GroupService.fetchGroups()).rejects.toThrow("Bad request");
    });
  });

  describe("fetchGroup", () => {
    it("GETs the group by slug and unwraps the group field", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ group: SAMPLE_GROUP }));

      const result = await GroupService.fetchGroup(GROUP_SLUG);

      expect(mockFetch).toHaveBeenCalledWith(`/api/groups/${GROUP_SLUG}`);
      expect(result).toEqual(SAMPLE_GROUP);
    });

    it("throws on 404", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ error: "Group not found" }, 404));

      await expect(GroupService.fetchGroup(GROUP_SLUG)).rejects.toThrow("Group not found");
    });
  });

  describe("createGroup", () => {
    it("POSTs with JSON body and returns the created group", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ group: SAMPLE_GROUP }, 201));

      const result = await GroupService.createGroup({ name: "RPG Fans" });

      expect(mockFetch).toHaveBeenCalledWith("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "RPG Fans" }),
      });
      expect(result).toEqual(SAMPLE_GROUP);
    });
  });

  describe("leaveGroup", () => {
    it("DELETEs the join endpoint to leave", async () => {
      mockFetch.mockResolvedValue(new Response(null, { status: 204 }));

      await GroupService.leaveGroup(GROUP_SLUG);

      expect(mockFetch).toHaveBeenCalledWith(`/api/groups/${GROUP_SLUG}/join`, {
        method: "DELETE",
      });
    });
  });

  describe("fetchMembers", () => {
    it("returns the members list", async () => {
      const members: GroupMember[] = [
        {
          id: "m1",
          groupId: SAMPLE_GROUP.id,
          playerId: PLAYER_ID,
          role: "owner",
          joinedAt: "2024-01-01T00:00:00Z",
          player: { id: PLAYER_ID, username: "OwnerName", avatarUrl: null },
        },
      ];
      mockFetch.mockResolvedValue(jsonResponse({ members }));

      const result = await GroupService.fetchMembers(GROUP_SLUG);

      expect(result).toEqual(members);
    });
  });

  describe("createPost", () => {
    it("POSTs the content and returns the created post", async () => {
      const post: GroupPost = {
        id: "p1",
        groupId: SAMPLE_GROUP.id,
        authorId: PLAYER_ID,
        content: "Hello group!",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        author: { id: PLAYER_ID, username: "OwnerName", avatarUrl: null },
      };
      mockFetch.mockResolvedValue(jsonResponse({ post }, 201));

      const result = await GroupService.createPost(GROUP_SLUG, { content: "Hello group!" });

      expect(mockFetch).toHaveBeenCalledWith(`/api/groups/${GROUP_SLUG}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Hello group!" }),
      });
      expect(result).toEqual(post);
    });
  });
});
