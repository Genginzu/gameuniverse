import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const COMMUNITY_ID = "cccccccc-cccc-4ccc-cccc-cccccccccccc";
const OWNER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const PLAYER_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const SLUG = "rpg-community";

const {
  mockGetCommunityAccess,
  mockGetMemberRole,
  mockJoinCommunity,
  mockLeaveCommunity,
  mockGetUser,
} = vi.hoisted(() => ({
  mockGetCommunityAccess: vi.fn(),
  mockGetMemberRole: vi.fn(),
  mockJoinCommunity: vi.fn(),
  mockLeaveCommunity: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock("@/lib/services/communityServerService", () => ({
  CommunityServerService: { getCommunityAccess: mockGetCommunityAccess },
}));

vi.mock("@/lib/services/communityMembersServerService", () => ({
  CommunityMembersServerService: {
    getMemberRole: mockGetMemberRole,
    joinCommunity: mockJoinCommunity,
    leaveCommunity: mockLeaveCommunity,
  },
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST, DELETE } from "@/app/api/communities/[slug]/join/route";

function makeParams(slug = SLUG): { params: Promise<{ slug: string }> } {
  return { params: Promise.resolve({ slug }) };
}

describe("/api/communities/[slug]/join — POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: PLAYER_ID } }, error: null });
    mockGetCommunityAccess.mockResolvedValue({
      id: COMMUNITY_ID,
      visibility: "public",
      ownerId: OWNER_ID,
    });
    mockGetMemberRole.mockResolvedValue(null);
    mockJoinCommunity.mockResolvedValue(undefined);
  });

  it("returns 201 and joins the community", async () => {
    const req = new NextRequest(`http://localhost/api/communities/${SLUG}/join`, {
      method: "POST",
    });
    const res = await POST(req, makeParams());

    expect(res.status).toBe(201);
    expect(mockJoinCommunity).toHaveBeenCalledWith(COMMUNITY_ID, PLAYER_ID);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const req = new NextRequest(`http://localhost/api/communities/${SLUG}/join`, {
      method: "POST",
    });
    const res = await POST(req, makeParams());

    expect(res.status).toBe(401);
  });

  it("returns 404 when the community does not exist", async () => {
    mockGetCommunityAccess.mockResolvedValue(null);
    const req = new NextRequest(`http://localhost/api/communities/${SLUG}/join`, {
      method: "POST",
    });
    const res = await POST(req, makeParams());

    expect(res.status).toBe(404);
  });

  it("returns 403 when the community is private", async () => {
    mockGetCommunityAccess.mockResolvedValue({
      id: COMMUNITY_ID,
      visibility: "private",
      ownerId: OWNER_ID,
    });
    const req = new NextRequest(`http://localhost/api/communities/${SLUG}/join`, {
      method: "POST",
    });
    const res = await POST(req, makeParams());

    expect(res.status).toBe(403);
  });

  it("returns 409 when already a member", async () => {
    mockGetMemberRole.mockResolvedValue("member");
    const req = new NextRequest(`http://localhost/api/communities/${SLUG}/join`, {
      method: "POST",
    });
    const res = await POST(req, makeParams());

    expect(res.status).toBe(409);
  });
});

describe("/api/communities/[slug]/join — DELETE", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: PLAYER_ID } }, error: null });
    mockGetCommunityAccess.mockResolvedValue({
      id: COMMUNITY_ID,
      visibility: "public",
      ownerId: OWNER_ID,
    });
    mockLeaveCommunity.mockResolvedValue(undefined);
  });

  it("returns 204 and leaves the community", async () => {
    const req = new NextRequest(`http://localhost/api/communities/${SLUG}/join`, {
      method: "DELETE",
    });
    const res = await DELETE(req, makeParams());

    expect(res.status).toBe(204);
    expect(mockLeaveCommunity).toHaveBeenCalledWith(COMMUNITY_ID, PLAYER_ID);
  });

  it("returns 403 when the owner tries to leave", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: OWNER_ID } }, error: null });
    const req = new NextRequest(`http://localhost/api/communities/${SLUG}/join`, {
      method: "DELETE",
    });
    const res = await DELETE(req, makeParams());

    expect(res.status).toBe(403);
    expect(mockLeaveCommunity).not.toHaveBeenCalled();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const req = new NextRequest(`http://localhost/api/communities/${SLUG}/join`, {
      method: "DELETE",
    });
    const res = await DELETE(req, makeParams());

    expect(res.status).toBe(401);
  });

  it("returns 404 when the community does not exist", async () => {
    mockGetCommunityAccess.mockResolvedValue(null);
    const req = new NextRequest(`http://localhost/api/communities/${SLUG}/join`, {
      method: "DELETE",
    });
    const res = await DELETE(req, makeParams());

    expect(res.status).toBe(404);
  });
});
