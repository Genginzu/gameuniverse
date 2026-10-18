import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const GROUP_ID = "gggggggg-gggg-4ggg-gggg-gggggggggggg";
const OWNER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const PLAYER_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const SLUG = "rpg-fans";

const {
  mockGetGroupAccess,
  mockFetchGroupBySlug,
  mockGetMemberRole,
  mockFetchGroupInvitations,
  mockCreateInvitation,
  mockGetUser,
} = vi.hoisted(() => ({
  mockGetGroupAccess: vi.fn(),
  mockFetchGroupBySlug: vi.fn(),
  mockGetMemberRole: vi.fn(),
  mockFetchGroupInvitations: vi.fn(),
  mockCreateInvitation: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock("@/lib/services/groupServerService", () => ({
  GroupServerService: {
    getGroupAccess: mockGetGroupAccess,
    fetchGroupBySlug: mockFetchGroupBySlug,
  },
}));

vi.mock("@/lib/services/groupMembersServerService", () => ({
  GroupMembersServerService: { getMemberRole: mockGetMemberRole },
}));

vi.mock("@/lib/services/groupInvitationsServerService", () => ({
  GroupInvitationsServerService: {
    fetchGroupInvitations: mockFetchGroupInvitations,
    createInvitation: mockCreateInvitation,
  },
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET, POST } from "@/app/api/groups/[slug]/invitations/route";

function makeParams(slug = SLUG): { params: Promise<{ slug: string }> } {
  return { params: Promise.resolve({ slug }) };
}

describe("/api/groups/[slug]/invitations — GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: OWNER_ID } }, error: null });
    mockGetGroupAccess.mockResolvedValue({ id: GROUP_ID, visibility: "private", ownerId: OWNER_ID });
    mockGetMemberRole.mockResolvedValue("owner");
    mockFetchGroupInvitations.mockResolvedValue([{ id: "inv1" }]);
  });

  it("returns 200 with the invitations for owner/admin", async () => {
    const req = new NextRequest(`http://localhost/api/groups/${SLUG}/invitations`);
    const res = await GET(req, makeParams());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.invitations).toHaveLength(1);
  });

  it("returns 403 for a regular member", async () => {
    mockGetMemberRole.mockResolvedValue("member");
    const req = new NextRequest(`http://localhost/api/groups/${SLUG}/invitations`);
    const res = await GET(req, makeParams());

    expect(res.status).toBe(403);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const req = new NextRequest(`http://localhost/api/groups/${SLUG}/invitations`);
    const res = await GET(req, makeParams());

    expect(res.status).toBe(401);
  });

  it("returns 404 when the group does not exist", async () => {
    mockGetGroupAccess.mockResolvedValue(null);
    const req = new NextRequest(`http://localhost/api/groups/${SLUG}/invitations`);
    const res = await GET(req, makeParams());

    expect(res.status).toBe(404);
  });
});

describe("/api/groups/[slug]/invitations — POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: OWNER_ID } }, error: null });
    mockGetGroupAccess.mockResolvedValue({ id: GROUP_ID, visibility: "private", ownerId: OWNER_ID });
    mockGetMemberRole.mockResolvedValue("owner");
    mockFetchGroupBySlug.mockResolvedValue({ id: GROUP_ID, name: "RPG Fans" });
    mockCreateInvitation.mockResolvedValue({ id: "inv1", status: "pending" });
  });

  it("returns 201 when inviting by username", async () => {
    const req = new NextRequest(`http://localhost/api/groups/${SLUG}/invitations`, {
      method: "POST",
      body: JSON.stringify({ username: "Bob" }),
    });
    const res = await POST(req, makeParams());

    expect(res.status).toBe(201);
    expect(mockCreateInvitation).toHaveBeenCalledWith(
      GROUP_ID,
      SLUG,
      "RPG Fans",
      OWNER_ID,
      expect.objectContaining({ username: "Bob" })
    );
  });

  it("returns 400 when both email and username are provided", async () => {
    const req = new NextRequest(`http://localhost/api/groups/${SLUG}/invitations`, {
      method: "POST",
      body: JSON.stringify({ email: "a@b.com", username: "Bob" }),
    });
    const res = await POST(req, makeParams());

    expect(res.status).toBe(400);
  });

  it("returns 403 for a regular member", async () => {
    mockGetMemberRole.mockResolvedValue("member");
    const req = new NextRequest(`http://localhost/api/groups/${SLUG}/invitations`, {
      method: "POST",
      body: JSON.stringify({ username: "Bob" }),
    });
    const res = await POST(req, makeParams());

    expect(res.status).toBe(403);
  });

  it("returns 409 when the invitation already exists", async () => {
    mockCreateInvitation.mockRejectedValue(
      new Error("An invitation is already pending for this player")
    );
    const req = new NextRequest(`http://localhost/api/groups/${SLUG}/invitations`, {
      method: "POST",
      body: JSON.stringify({ username: "Bob" }),
    });
    const res = await POST(req, makeParams());

    expect(res.status).toBe(409);
  });

  it("returns 404 when the target player does not exist", async () => {
    mockCreateInvitation.mockRejectedValue(new Error("Player not found"));
    const req = new NextRequest(`http://localhost/api/groups/${SLUG}/invitations`, {
      method: "POST",
      body: JSON.stringify({ username: "Ghost" }),
    });
    const res = await POST(req, makeParams());

    expect(res.status).toBe(404);
  });
});
