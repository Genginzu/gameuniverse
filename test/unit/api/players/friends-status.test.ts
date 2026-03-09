import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const PLAYER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const USER_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

const { mockGetRelationshipStatus, mockGetUser } = vi.hoisted(() => ({
  mockGetRelationshipStatus: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock("../../../../src/lib/services/friendServerService", () => ({
  FriendServerService: {
    getRelationshipStatus: mockGetRelationshipStatus,
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

import { GET } from "../../../../src/app/api/players/[id]/friends/status/route";

function makeParams(id = PLAYER_ID): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe("/api/players/[id]/friends/status — GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
    mockGetRelationshipStatus.mockResolvedValue({ status: "none" });
  });

  it("returns 200 with relationship status", async () => {
    mockGetRelationshipStatus.mockResolvedValue({ status: "accepted", friendshipId: "f1" });
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/friends/status`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("accepted");
    expect(body.friendshipId).toBe("f1");
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "No session" } });
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/friends/status`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(401);
  });

  it("calls getRelationshipStatus with correct user and target", async () => {
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/friends/status`);
    await GET(req, makeParams());
    expect(mockGetRelationshipStatus).toHaveBeenCalledWith(USER_ID, PLAYER_ID);
  });

  it("returns 500 on unexpected error", async () => {
    mockGetRelationshipStatus.mockRejectedValue(new Error("DB error"));
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/friends/status`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });
});
