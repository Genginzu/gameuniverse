import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FriendService } from "@/lib/services/friendService";
import type { FriendsListResponse, RelationshipStatusResponse } from "@/types/friendship";

const mockFetch = vi.fn<(input: string | URL | Request) => Promise<Response>>();

const PLAYER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const FRIENDSHIP_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

const SAMPLE_FRIENDS_RESPONSE: FriendsListResponse = {
  friends: [
    {
      id: "cccccccc-cccc-4ccc-cccc-cccccccccccc",
      friendshipId: FRIENDSHIP_ID,
      displayName: "PlayerOne",
      avatarUrl: "https://example.com/avatar.png",
      level: 5,
      acceptedAt: "2024-03-01T12:00:00Z",
    },
  ],
  totalCount: 1,
  pagination: { currentPage: 1, totalPages: 1, hasNextPage: false },
};

const SAMPLE_STATUS_RESPONSE: RelationshipStatusResponse = {
  status: "accepted",
  friendshipId: FRIENDSHIP_ID,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("FriendService", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  // ── getFriends ──────────────────────────────────────────────────────

  describe("getFriends", () => {
    it("should build URL without query params when none provided", async () => {
      mockFetch.mockResolvedValue(jsonResponse(SAMPLE_FRIENDS_RESPONSE));

      await FriendService.getFriends(PLAYER_ID);

      expect(mockFetch).toHaveBeenCalledWith(`/api/players/${PLAYER_ID}/friends`);
    });

    it("should include page param in URL", async () => {
      mockFetch.mockResolvedValue(jsonResponse(SAMPLE_FRIENDS_RESPONSE));

      await FriendService.getFriends(PLAYER_ID, { page: 2 });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain(`/api/players/${PLAYER_ID}/friends?`);
      expect(calledUrl).toContain("page=2");
    });

    it("should include page and limit params in URL", async () => {
      mockFetch.mockResolvedValue(jsonResponse(SAMPLE_FRIENDS_RESPONSE));

      await FriendService.getFriends(PLAYER_ID, { page: 2, limit: 10 });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("page=2");
      expect(calledUrl).toContain("limit=10");
    });

    it("should return FriendsListResponse on success", async () => {
      mockFetch.mockResolvedValue(jsonResponse(SAMPLE_FRIENDS_RESPONSE));

      const result = await FriendService.getFriends(PLAYER_ID);

      expect(result).toEqual(SAMPLE_FRIENDS_RESPONSE);
    });

    it("should throw with server error message on failure", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ error: "Player not found" }, 404));

      await expect(FriendService.getFriends(PLAYER_ID)).rejects.toThrow("Player not found");
    });

    it("should throw with fallback message when body has no error field", async () => {
      mockFetch.mockResolvedValue(jsonResponse({}, 500));

      await expect(FriendService.getFriends(PLAYER_ID)).rejects.toThrow("Failed to fetch friends");
    });
  });

  // ── getRelationshipStatus ──────────────────────────────────────────

  describe("getRelationshipStatus", () => {
    it("should call correct URL", async () => {
      mockFetch.mockResolvedValue(jsonResponse(SAMPLE_STATUS_RESPONSE));

      await FriendService.getRelationshipStatus(PLAYER_ID);

      expect(mockFetch).toHaveBeenCalledWith(`/api/players/${PLAYER_ID}/friends/status`);
    });

    it("should return RelationshipStatusResponse on success", async () => {
      mockFetch.mockResolvedValue(jsonResponse(SAMPLE_STATUS_RESPONSE));

      const result = await FriendService.getRelationshipStatus(PLAYER_ID);

      expect(result).toEqual(SAMPLE_STATUS_RESPONSE);
    });

    it("should throw with server error message on failure", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ error: "Unauthorized" }, 401));

      await expect(FriendService.getRelationshipStatus(PLAYER_ID)).rejects.toThrow("Unauthorized");
    });
  });

  // ── sendFriendRequest ──────────────────────────────────────────────

  describe("sendFriendRequest", () => {
    it("should POST to correct URL", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }, 201));

      await FriendService.sendFriendRequest(PLAYER_ID);

      expect(mockFetch).toHaveBeenCalledWith(`/api/players/${PLAYER_ID}/friends`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    });

    it("should return response body on success", async () => {
      const body = { id: FRIENDSHIP_ID, status: "pending" };
      mockFetch.mockResolvedValue(jsonResponse(body, 201));

      const result = await FriendService.sendFriendRequest(PLAYER_ID);

      expect(result).toEqual(body);
    });

    it("should throw with server error message on 409", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ error: "Friendship already exists" }, 409));

      await expect(FriendService.sendFriendRequest(PLAYER_ID)).rejects.toThrow(
        "Friendship already exists"
      );
    });
  });

  // ── acceptFriendRequest ────────────────────────────────────────────

  describe("acceptFriendRequest", () => {
    it("should PATCH to correct URL", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }));

      await FriendService.acceptFriendRequest(PLAYER_ID, FRIENDSHIP_ID);

      expect(mockFetch).toHaveBeenCalledWith(`/api/players/${PLAYER_ID}/friends/${FRIENDSHIP_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
    });

    it("should return response body on success", async () => {
      const body = { id: FRIENDSHIP_ID, status: "accepted" };
      mockFetch.mockResolvedValue(jsonResponse(body));

      const result = await FriendService.acceptFriendRequest(PLAYER_ID, FRIENDSHIP_ID);

      expect(result).toEqual(body);
    });

    it("should throw with server error message on failure", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ error: "Forbidden" }, 403));

      await expect(FriendService.acceptFriendRequest(PLAYER_ID, FRIENDSHIP_ID)).rejects.toThrow(
        "Forbidden"
      );
    });
  });

  // ── declineFriendRequest ───────────────────────────────────────────

  describe("declineFriendRequest", () => {
    it("should DELETE to correct URL", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }));

      await FriendService.declineFriendRequest(PLAYER_ID, FRIENDSHIP_ID);

      expect(mockFetch).toHaveBeenCalledWith(`/api/players/${PLAYER_ID}/friends/${FRIENDSHIP_ID}`, {
        method: "DELETE",
      });
    });

    it("should return response body on success", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }));

      const result = await FriendService.declineFriendRequest(PLAYER_ID, FRIENDSHIP_ID);

      expect(result).toEqual({ success: true });
    });

    it("should throw with server error message on failure", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ error: "Friendship not found" }, 404));

      await expect(FriendService.declineFriendRequest(PLAYER_ID, FRIENDSHIP_ID)).rejects.toThrow(
        "Friendship not found"
      );
    });
  });

  // ── removeFriend ───────────────────────────────────────────────────

  describe("removeFriend", () => {
    it("should DELETE to correct URL", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }));

      await FriendService.removeFriend(PLAYER_ID, FRIENDSHIP_ID);

      expect(mockFetch).toHaveBeenCalledWith(`/api/players/${PLAYER_ID}/friends/${FRIENDSHIP_ID}`, {
        method: "DELETE",
      });
    });

    it("should return response body on success", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }));

      const result = await FriendService.removeFriend(PLAYER_ID, FRIENDSHIP_ID);

      expect(result).toEqual({ success: true });
    });

    it("should throw with server error message on failure", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ error: "Unauthorized" }, 401));

      await expect(FriendService.removeFriend(PLAYER_ID, FRIENDSHIP_ID)).rejects.toThrow(
        "Unauthorized"
      );
    });
  });
});
