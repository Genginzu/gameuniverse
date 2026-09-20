import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const GROUP_ID = "gggggggg-gggg-4ggg-gggg-gggggggggggg";
const OWNER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const PLAYER_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const SLUG = "rpg-fans";

const { mockGetGroupAccess, mockGetMemberRole, mockJoinGroup, mockLeaveGroup, mockGetUser } =
  vi.hoisted(() => ({
    mockGetGroupAccess: vi.fn(),
    mockGetMemberRole: vi.fn(),
    mockJoinGroup: vi.fn(),
    mockLeaveGroup: vi.fn(),
    mockGetUser: vi.fn(),
  }));

vi.mock("@/lib/services/groupServerService", () => ({
  GroupServerService: { getGroupAccess: mockGetGroupAccess },
}));

vi.mock("@/lib/services/groupMembersServerService", () => ({
  GroupMembersServerService: {
    getMemberRole: mockGetMemberRole,
    joinGroup: mockJoinGroup,
    leaveGroup: mockLeaveGroup,
  },
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST, DELETE } from "@/app/api/groups/[slug]/join/route";

function makeParams(slug = SLUG): { params: Promise<{ slug: string }> } {
  return { params: Promise.resolve({ slug }) };
}

describe("/api/groups/[slug]/join — POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: PLAYER_ID } }, error: null });
    mockGetGroupAccess.mockResolvedValue({ id: GROUP_ID, visibility: "public", ownerId: OWNER_ID });
    mockGetMemberRole.mockResolvedValue(null);
    mockJoinGroup.mockResolvedValue(undefined);
  });

  it("returns 201 and joins the group", async () => {
    const req = new NextRequest(`http://localhost/api/groups/${SLUG}/join`, { method: "POST" });
    const res = await POST(req, makeParams());

    expect(res.status).toBe(201);
    expect(mockJoinGroup).toHaveBeenCalledWith(GROUP_ID, PLAYER_ID);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const req = new NextRequest(`http://localhost/api/groups/${SLUG}/join`, { method: "POST" });
    const res = await POST(req, makeParams());

    expect(res.status).toBe(401);
  });

  it("returns 404 when the group does not exist", async () => {
    mockGetGroupAccess.mockResolvedValue(null);
    const req = new NextRequest(`http://localhost/api/groups/${SLUG}/join`, { method: "POST" });
    const res = await POST(req, makeParams());

    expect(res.status).toBe(404);
  });

  it("returns 403 when the group is private", async () => {
    mockGetGroupAccess.mockResolvedValue({ id: GROUP_ID, visibility: "private", ownerId: OWNER_ID });
    const req = new NextRequest(`http://localhost/api/groups/${SLUG}/join`, { method: "POST" });
    const res = await POST(req, makeParams());

    expect(res.status).toBe(403);
  });

  it("returns 409 when already a member", async () => {
    mockGetMemberRole.mockResolvedValue("member");
    const req = new NextRequest(`http://localhost/api/groups/${SLUG}/join`, { method: "POST" });
    const res = await POST(req, makeParams());

    expect(res.status).toBe(409);
  });
});

describe("/api/groups/[slug]/join — DELETE", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: PLAYER_ID } }, error: null });
    mockGetGroupAccess.mockResolvedValue({ id: GROUP_ID, visibility: "public", ownerId: OWNER_ID });
    mockLeaveGroup.mockResolvedValue(undefined);
  });

  it("returns 204 and leaves the group", async () => {
    const req = new NextRequest(`http://localhost/api/groups/${SLUG}/join`, { method: "DELETE" });
    const res = await DELETE(req, makeParams());

    expect(res.status).toBe(204);
    expect(mockLeaveGroup).toHaveBeenCalledWith(GROUP_ID, PLAYER_ID);
  });

  it("returns 403 when the owner tries to leave", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: OWNER_ID } }, error: null });
    const req = new NextRequest(`http://localhost/api/groups/${SLUG}/join`, { method: "DELETE" });
    const res = await DELETE(req, makeParams());

    expect(res.status).toBe(403);
    expect(mockLeaveGroup).not.toHaveBeenCalled();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const req = new NextRequest(`http://localhost/api/groups/${SLUG}/join`, { method: "DELETE" });
    const res = await DELETE(req, makeParams());

    expect(res.status).toBe(401);
  });

  it("returns 404 when the group does not exist", async () => {
    mockGetGroupAccess.mockResolvedValue(null);
    const req = new NextRequest(`http://localhost/api/groups/${SLUG}/join`, { method: "DELETE" });
    const res = await DELETE(req, makeParams());

    expect(res.status).toBe(404);
  });
});
