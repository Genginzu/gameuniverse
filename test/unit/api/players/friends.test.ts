import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const PLAYER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const USER_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

const {
  mockGetFriends,
  mockGetPendingRequests,
  mockGetRelationshipStatus,
  mockSendRequest,
  mockParsePaginationParams,
  mockGetUser,
  mockFrom,
} = vi.hoisted(() => ({
  mockGetFriends: vi.fn(),
  mockGetPendingRequests: vi.fn(),
  mockGetRelationshipStatus: vi.fn(),
  mockSendRequest: vi.fn(),
  mockParsePaginationParams: vi.fn(() => ({ page: 1, limit: 20 })),
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("../../../../src/lib/services/friendServerService", () => ({
  FriendServerService: {
    getFriends: mockGetFriends,
    getPendingRequests: mockGetPendingRequests,
    getRelationshipStatus: mockGetRelationshipStatus,
    sendRequest: mockSendRequest,
  },
}));

vi.mock("../../../../src/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    })
  ),
}));

vi.mock("../../../../src/lib/api-utils", () => ({
  parsePaginationParams: mockParsePaginationParams,
}));

vi.mock("../../../../src/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET, POST } from "../../../../src/app/api/players/[id]/friends/route";

function makeParams(id = PLAYER_ID): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

const FRIENDS_RESPONSE = {
  friends: [{ id: "f1", displayName: "Alice", level: 5, acceptedAt: "2024-01-01T00:00:00Z" }],
  totalCount: 1,
  pagination: { currentPage: 1, totalPages: 1, hasNextPage: false },
};

describe("/api/players/[id]/friends — GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFriends.mockResolvedValue({ ...FRIENDS_RESPONSE });
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
  });

  it("returns 200 with friends list for a visitor", async () => {
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/friends`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.friends).toHaveLength(1);
    expect(body.pendingRequests).toBeUndefined();
  });

  it("includes pending requests when requester is the owner", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: PLAYER_ID } }, error: null });
    mockGetPendingRequests.mockResolvedValue([{ friendshipId: "pr1" }]);
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/friends`);
    const res = await GET(req, makeParams());
    const body = await res.json();
    expect(body.pendingRequests).toHaveLength(1);
  });

  it("uses parsePaginationParams for page/limit", async () => {
    mockParsePaginationParams.mockReturnValue({ page: 2, limit: 10 });
    const req = new NextRequest(
      `http://localhost/api/players/${PLAYER_ID}/friends?page=2&limit=10`
    );
    await GET(req, makeParams());
    expect(mockGetFriends).toHaveBeenCalledWith(PLAYER_ID, 2, 10);
  });

  it("returns 500 on unexpected error", async () => {
    mockGetFriends.mockRejectedValue(new Error("DB down"));
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/friends`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });
});

describe("/api/players/[id]/friends — POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: PLAYER_ID } }),
        }),
      }),
    });
    mockGetRelationshipStatus.mockResolvedValue({ status: "none" });
    mockSendRequest.mockResolvedValue({ id: "new-friendship", status: "pending" });
  });

  it("returns 201 when sending a valid friend request", async () => {
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/friends`, {
      method: "POST",
    });
    const res = await POST(req, makeParams());
    expect(res.status).toBe(201);
    expect(mockSendRequest).toHaveBeenCalledWith(USER_ID, PLAYER_ID);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "No session" } });
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/friends`, {
      method: "POST",
    });
    const res = await POST(req, makeParams());
    expect(res.status).toBe(401);
  });

  it("returns 400 when sending request to yourself", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: PLAYER_ID } }, error: null });
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/friends`, {
      method: "POST",
    });
    const res = await POST(req, makeParams());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("yourself");
  });

  it("returns 404 when target player does not exist", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    });
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/friends`, {
      method: "POST",
    });
    const res = await POST(req, makeParams());
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("not found");
  });

  it("returns 409 when relationship already exists", async () => {
    mockGetRelationshipStatus.mockResolvedValue({ status: "accepted", friendshipId: "f1" });
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/friends`, {
      method: "POST",
    });
    const res = await POST(req, makeParams());
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("already exists");
  });

  it("returns 500 on unexpected error", async () => {
    mockSendRequest.mockRejectedValue(new Error("DB error"));
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/friends`, {
      method: "POST",
    });
    const res = await POST(req, makeParams());
    expect(res.status).toBe(500);
  });
});
