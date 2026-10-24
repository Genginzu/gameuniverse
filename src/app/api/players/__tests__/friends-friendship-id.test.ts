import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";

const PLAYER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const USER_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const FRIENDSHIP_ID = "cccccccc-cccc-4ccc-cccc-cccccccccccc";

const { mockAcceptRequest, mockDeleteRequest, mockFriendAccepted } = vi.hoisted(() => ({
  mockAcceptRequest: vi.fn(),
  mockDeleteRequest: vi.fn(),
  mockFriendAccepted: vi.fn(),
}));

const routeEnv = useTestRouteEnvironment({ signedInAs: testUser("user", { id: USER_ID }) });

vi.mock("@/lib/services/friendServerService", () => ({
  FriendServerService: {
    acceptRequest: mockAcceptRequest,
    deleteRequest: mockDeleteRequest,
  },
}));

vi.mock("@/lib/services/notifications", () => ({
  friendAccepted: mockFriendAccepted,
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { PATCH, DELETE } from "@/app/api/players/[id]/friends/[friendshipId]/route";

function makeFriendshipParams(id = PLAYER_ID, friendshipId = FRIENDSHIP_ID) {
  return { params: Promise.resolve({ id, friendshipId }) };
}

function friendshipRequest(method: "PATCH" | "DELETE") {
  return new NextRequest(`http://localhost/api/players/${PLAYER_ID}/friends/${FRIENDSHIP_ID}`, {
    method,
  });
}

describe("/api/players/[id]/friends/[friendshipId] — PATCH", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAcceptRequest.mockResolvedValue({
      id: FRIENDSHIP_ID,
      status: "accepted",
      sender_id: "sender-uuid",
    });
    mockFriendAccepted.mockResolvedValue(null);
  });

  it("returns 200 when accepting a friend request", async () => {
    const res = await PATCH(friendshipRequest("PATCH"), makeFriendshipParams());
    expect(res.status).toBe(200);
    expect(mockAcceptRequest).toHaveBeenCalledWith(FRIENDSHIP_ID, USER_ID);
  });

  it("sends friend_accepted notification to the original requester", async () => {
    await PATCH(friendshipRequest("PATCH"), makeFriendshipParams());
    expect(mockFriendAccepted).toHaveBeenCalledWith({
      friendshipId: FRIENDSHIP_ID,
      accepterId: USER_ID,
      requesterId: "sender-uuid",
    });
  });

  it("returns 401 when not authenticated", async () => {
    routeEnv.signOut();
    const res = await PATCH(friendshipRequest("PATCH"), makeFriendshipParams());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Authentication required", code: "unauthorized" });
  });

  it("returns 404 when friendship not found (PGRST116)", async () => {
    mockAcceptRequest.mockRejectedValue(new Error("Friendship not found"));
    const res = await PATCH(friendshipRequest("PATCH"), makeFriendshipParams());
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Friendship not found", code: "not_found" });
  });

  it("returns 500 on unexpected error", async () => {
    mockAcceptRequest.mockRejectedValue(new Error("DB error"));
    const res = await PATCH(friendshipRequest("PATCH"), makeFriendshipParams());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });
});

describe("/api/players/[id]/friends/[friendshipId] — DELETE", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteRequest.mockResolvedValue({ success: true });
  });

  it("returns 200 when deleting a friendship", async () => {
    const res = await DELETE(friendshipRequest("DELETE"), makeFriendshipParams());
    expect(res.status).toBe(200);
    expect(mockDeleteRequest).toHaveBeenCalledWith(FRIENDSHIP_ID, USER_ID);
  });

  it("returns 401 when not authenticated", async () => {
    routeEnv.signOut();
    const res = await DELETE(friendshipRequest("DELETE"), makeFriendshipParams());
    expect(res.status).toBe(401);
  });

  it("returns 404 on error", async () => {
    mockDeleteRequest.mockRejectedValue(new Error("Not found"));
    const res = await DELETE(friendshipRequest("DELETE"), makeFriendshipParams());
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("not found");
  });
});
