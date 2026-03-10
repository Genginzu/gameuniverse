import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const PLAYER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const USER_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const FRIENDSHIP_ID = "cccccccc-cccc-4ccc-cccc-cccccccccccc";

const { mockAcceptRequest, mockDeleteRequest, mockGetUser } = vi.hoisted(() => ({
  mockAcceptRequest: vi.fn(),
  mockDeleteRequest: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock("../../../../src/lib/services/friendServerService", () => ({
  FriendServerService: {
    acceptRequest: mockAcceptRequest,
    deleteRequest: mockDeleteRequest,
  },
}));

vi.mock("../../../../src/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
    })
  ),
}));

vi.mock("../../../../src/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { PATCH, DELETE } from "../../../../src/app/api/players/[id]/friends/[friendshipId]/route";

function makeFriendshipParams(id = PLAYER_ID, friendshipId = FRIENDSHIP_ID) {
  return { params: Promise.resolve({ id, friendshipId }) };
}

describe("/api/players/[id]/friends/[friendshipId] — PATCH", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
    mockAcceptRequest.mockResolvedValue({ id: FRIENDSHIP_ID, status: "accepted" });
  });

  it("returns 200 when accepting a friend request", async () => {
    const req = new NextRequest(
      `http://localhost/api/players/${PLAYER_ID}/friends/${FRIENDSHIP_ID}`,
      { method: "PATCH" }
    );
    const res = await PATCH(req, makeFriendshipParams());
    expect(res.status).toBe(200);
    expect(mockAcceptRequest).toHaveBeenCalledWith(FRIENDSHIP_ID, USER_ID);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "No session" } });
    const req = new NextRequest(
      `http://localhost/api/players/${PLAYER_ID}/friends/${FRIENDSHIP_ID}`,
      { method: "PATCH" }
    );
    const res = await PATCH(req, makeFriendshipParams());
    expect(res.status).toBe(401);
  });

  it("returns 404 when friendship not found (PGRST116)", async () => {
    mockAcceptRequest.mockRejectedValue(new Error("Friendship not found"));
    const req = new NextRequest(
      `http://localhost/api/players/${PLAYER_ID}/friends/${FRIENDSHIP_ID}`,
      { method: "PATCH" }
    );
    const res = await PATCH(req, makeFriendshipParams());
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("not found");
  });

  it("returns 500 on unexpected error", async () => {
    mockAcceptRequest.mockRejectedValue(new Error("DB error"));
    const req = new NextRequest(
      `http://localhost/api/players/${PLAYER_ID}/friends/${FRIENDSHIP_ID}`,
      { method: "PATCH" }
    );
    const res = await PATCH(req, makeFriendshipParams());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });
});

describe("/api/players/[id]/friends/[friendshipId] — DELETE", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
    mockDeleteRequest.mockResolvedValue({ success: true });
  });

  it("returns 200 when deleting a friendship", async () => {
    const req = new NextRequest(
      `http://localhost/api/players/${PLAYER_ID}/friends/${FRIENDSHIP_ID}`,
      { method: "DELETE" }
    );
    const res = await DELETE(req, makeFriendshipParams());
    expect(res.status).toBe(200);
    expect(mockDeleteRequest).toHaveBeenCalledWith(FRIENDSHIP_ID, USER_ID);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "No session" } });
    const req = new NextRequest(
      `http://localhost/api/players/${PLAYER_ID}/friends/${FRIENDSHIP_ID}`,
      { method: "DELETE" }
    );
    const res = await DELETE(req, makeFriendshipParams());
    expect(res.status).toBe(401);
  });

  it("returns 404 on error", async () => {
    mockDeleteRequest.mockRejectedValue(new Error("Not found"));
    const req = new NextRequest(
      `http://localhost/api/players/${PLAYER_ID}/friends/${FRIENDSHIP_ID}`,
      { method: "DELETE" }
    );
    const res = await DELETE(req, makeFriendshipParams());
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("not found");
  });
});
