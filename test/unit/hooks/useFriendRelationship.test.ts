import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createSWRWrapper } from "../../helpers/swr-wrapper";

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "visitor-id" } }) }));
vi.mock("@/lib/services/friendService", () => ({
  FriendService: {
    sendFriendRequest: vi.fn(),
    acceptFriendRequest: vi.fn(),
    declineFriendRequest: vi.fn(),
    removeFriend: vi.fn(),
  },
}));

import { useFriendRelationship } from "@/hooks/useFriendRelationship";
import { FriendService } from "@/lib/services/friendService";

const mockedSendRequest = FriendService.sendFriendRequest as ReturnType<typeof vi.fn>;

describe("useFriendRelationship", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSendRequest.mockResolvedValue(undefined);
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/friends?")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ totalCount: 42, friends: [], pagination: {} }),
        });
      }
      if (typeof url === "string" && url.includes("/friends/status")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ status: "accepted", friendshipId: "fs-1" }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it("returns friendCount from SWR data", async () => {
    const { result } = renderHook(() => useFriendRelationship("player-1"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => expect(result.current.friendCount).toBe(42));
  });

  it("returns relationshipStatus from SWR data", async () => {
    const { result } = renderHook(() => useFriendRelationship("player-1"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => expect(result.current.relationshipStatus).toBe("accepted"));
    expect(result.current.relationshipFriendshipId).toBe("fs-1");
  });

  it("sendRequest calls FriendService.sendFriendRequest", async () => {
    const { result } = renderHook(() => useFriendRelationship("player-1"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => expect(result.current.friendCount).toBe(42));

    await act(async () => {
      await result.current.sendRequest();
    });

    expect(mockedSendRequest).toHaveBeenCalledWith("player-1");
  });
});
