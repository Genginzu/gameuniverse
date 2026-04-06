import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "user1" } }) }));
vi.mock("@/lib/services/friendService", () => ({
  FriendService: {
    getFriends: vi.fn(),
    getRelationshipStatus: vi.fn(),
    sendFriendRequest: vi.fn(),
    acceptFriendRequest: vi.fn(),
    declineFriendRequest: vi.fn(),
    removeFriend: vi.fn(),
  },
}));

import { useFriends } from "@/hooks/useFriends";
import { FriendService } from "@/lib/services/friendService";

const mockedGetFriends = FriendService.getFriends as ReturnType<typeof vi.fn>;
const mockedGetStatus = FriendService.getRelationshipStatus as ReturnType<typeof vi.fn>;
const mockedSendRequest = FriendService.sendFriendRequest as ReturnType<typeof vi.fn>;

const mockFriendsResponse = {
  friends: [{ id: "f1", username: "alice", avatarUrl: null }],
  totalCount: 1,
  pagination: { hasNextPage: false, currentPage: 1, totalPages: 1 },
  pendingRequests: [],
};

describe("useFriends", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetFriends.mockResolvedValue(mockFriendsResponse);
    mockedGetStatus.mockResolvedValue({ status: "none", friendshipId: null });
    mockedSendRequest.mockResolvedValue(undefined);
  });

  it("fetches friends on mount", async () => {
    const { result } = renderHook(() => useFriends("player-1", "fr"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.friends).toEqual(mockFriendsResponse.friends);
    expect(result.current.friendCount).toBe(1);
    expect(result.current.error).toBeNull();
    expect(mockedGetFriends).toHaveBeenCalledWith("player-1", { page: 1 });
  });

  it("handles fetch error", async () => {
    mockedGetFriends.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useFriends("player-1", "fr"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Network error");
    expect(result.current.friends).toEqual([]);
  });

  it("sendRequest calls FriendService and updates status optimistically", async () => {
    // Render as a visitor (different playerId than user1)
    const { result } = renderHook(() => useFriends("player-2", "fr"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.sendRequest();
    });

    expect(mockedSendRequest).toHaveBeenCalledWith("player-2");
    expect(result.current.relationshipStatus).toBe("pending_sent");
  });
});
