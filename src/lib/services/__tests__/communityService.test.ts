import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CommunityService, buildCommunitiesUrl } from "@/lib/services/communityService";
import type { CommunityDetail, CommunityListResponse, CommunityMember, CommunityPost } from "@/types/community";

const mockFetch = vi.fn<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>();

const COMMUNITY_SLUG = "rpg-community";
const PLAYER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

const SAMPLE_COMMUNITY: CommunityDetail = {
  id: "cccccccc-cccc-4ccc-cccc-cccccccccccc",
  name: "RPG Community",
  slug: COMMUNITY_SLUG,
  description: "A community for RPG lovers",
  imageUrl: null,
  visibility: "public",
  gameId: null,
  genreId: null,
  gameName: null,
  genreName: "RPG",
  membersCount: 10,
  ownerId: PLAYER_ID,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  owner: { id: PLAYER_ID, username: "OwnerName", avatarUrl: null },
  viewerRole: "owner",
};

const SAMPLE_LIST_RESPONSE: CommunityListResponse = {
  communities: [SAMPLE_COMMUNITY],
  pagination: { currentPage: 1, totalPages: 1, totalCount: 1, hasNextPage: false },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("buildCommunitiesUrl", () => {
  it("returns base URL when no params provided", () => {
    expect(buildCommunitiesUrl({})).toBe("/api/communities");
  });

  it("includes search, gameId, genreId, page params", () => {
    const url = buildCommunitiesUrl({ search: "rpg", gameId: "g1", genreId: "gen1", page: 2 });
    expect(url).toContain("search=rpg");
    expect(url).toContain("gameId=g1");
    expect(url).toContain("genreId=gen1");
    expect(url).toContain("page=2");
  });
});

describe("CommunityService", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  describe("fetchCommunities", () => {
    it("returns the list response on success", async () => {
      mockFetch.mockResolvedValue(jsonResponse(SAMPLE_LIST_RESPONSE));

      const result = await CommunityService.fetchCommunities({ search: "rpg" });

      expect(result).toEqual(SAMPLE_LIST_RESPONSE);
      expect(mockFetch).toHaveBeenCalledWith("/api/communities?search=rpg");
    });

    it("throws with the server error message on failure", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ error: "Bad request" }, 400));

      await expect(CommunityService.fetchCommunities()).rejects.toThrow("Bad request");
    });
  });

  describe("fetchCommunity", () => {
    it("GETs the community by slug and unwraps the community field", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ community: SAMPLE_COMMUNITY }));

      const result = await CommunityService.fetchCommunity(COMMUNITY_SLUG);

      expect(mockFetch).toHaveBeenCalledWith(`/api/communities/${COMMUNITY_SLUG}`);
      expect(result).toEqual(SAMPLE_COMMUNITY);
    });

    it("throws on 404", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ error: "Community not found" }, 404));

      await expect(CommunityService.fetchCommunity(COMMUNITY_SLUG)).rejects.toThrow(
        "Community not found"
      );
    });
  });

  describe("createCommunity", () => {
    it("POSTs with JSON body and returns the created community", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ community: SAMPLE_COMMUNITY }, 201));

      const result = await CommunityService.createCommunity({ name: "RPG Community" });

      expect(mockFetch).toHaveBeenCalledWith("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "RPG Community" }),
      });
      expect(result).toEqual(SAMPLE_COMMUNITY);
    });
  });

  describe("joinCommunity / leaveCommunity", () => {
    it("POSTs to the join endpoint", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }, 201));

      await CommunityService.joinCommunity(COMMUNITY_SLUG);

      expect(mockFetch).toHaveBeenCalledWith(`/api/communities/${COMMUNITY_SLUG}/join`, {
        method: "POST",
      });
    });

    it("DELETEs the join endpoint to leave", async () => {
      mockFetch.mockResolvedValue(new Response(null, { status: 204 }));

      await CommunityService.leaveCommunity(COMMUNITY_SLUG);

      expect(mockFetch).toHaveBeenCalledWith(`/api/communities/${COMMUNITY_SLUG}/join`, {
        method: "DELETE",
      });
    });

    it("throws when already a member (409)", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ error: "Already a member" }, 409));

      await expect(CommunityService.joinCommunity(COMMUNITY_SLUG)).rejects.toThrow(
        "Already a member"
      );
    });
  });

  describe("fetchMembers", () => {
    it("returns the members list", async () => {
      const members: CommunityMember[] = [
        {
          id: "m1",
          communityId: SAMPLE_COMMUNITY.id,
          playerId: PLAYER_ID,
          role: "owner",
          joinedAt: "2024-01-01T00:00:00Z",
          player: { id: PLAYER_ID, username: "OwnerName", avatarUrl: null },
        },
      ];
      mockFetch.mockResolvedValue(jsonResponse({ members }));

      const result = await CommunityService.fetchMembers(COMMUNITY_SLUG);

      expect(result).toEqual(members);
    });
  });

  describe("createPost", () => {
    it("POSTs the content and returns the created post", async () => {
      const post: CommunityPost = {
        id: "p1",
        communityId: SAMPLE_COMMUNITY.id,
        authorId: PLAYER_ID,
        content: "Hello community!",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        author: { id: PLAYER_ID, username: "OwnerName", avatarUrl: null },
      };
      mockFetch.mockResolvedValue(jsonResponse({ post }, 201));

      const result = await CommunityService.createPost(COMMUNITY_SLUG, {
        content: "Hello community!",
      });

      expect(mockFetch).toHaveBeenCalledWith(`/api/communities/${COMMUNITY_SLUG}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Hello community!" }),
      });
      expect(result).toEqual(post);
    });
  });
});
