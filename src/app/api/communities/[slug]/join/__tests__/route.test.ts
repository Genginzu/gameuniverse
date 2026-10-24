import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";

const COMMUNITY_ID = "cccccccc-cccc-4ccc-cccc-cccccccccccc";
const OWNER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const PLAYER_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const SLUG = "rpg-community";

const { mockGetCommunityAccess, mockGetMemberRole, mockJoinCommunity, mockLeaveCommunity } =
  vi.hoisted(() => ({
    mockGetCommunityAccess: vi.fn(),
    mockGetMemberRole: vi.fn(),
    mockJoinCommunity: vi.fn(),
    mockLeaveCommunity: vi.fn(),
  }));

const routeEnv = useTestRouteEnvironment({ signedInAs: testUser("user", { id: PLAYER_ID }) });

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

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST, DELETE } from "@/app/api/communities/[slug]/join/route";

function makeParams(slug = SLUG): { params: Promise<{ slug: string }> } {
  return { params: Promise.resolve({ slug }) };
}

function joinRequest(method: "POST" | "DELETE") {
  return new NextRequest(`http://localhost/api/communities/${SLUG}/join`, { method });
}

const PUBLIC_ACCESS = { id: COMMUNITY_ID, visibility: "public", ownerId: OWNER_ID };

describe("/api/communities/[slug]/join — POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCommunityAccess.mockResolvedValue(PUBLIC_ACCESS);
    mockGetMemberRole.mockResolvedValue(null);
    mockJoinCommunity.mockResolvedValue(undefined);
  });

  it("returns 201 and joins the community", async () => {
    const res = await POST(joinRequest("POST"), makeParams());

    expect(res.status).toBe(201);
    expect(mockJoinCommunity).toHaveBeenCalledWith(COMMUNITY_ID, PLAYER_ID);
  });

  it("returns 401 when not authenticated", async () => {
    routeEnv.signOut();
    const res = await POST(joinRequest("POST"), makeParams());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Authentication required", code: "unauthorized" });
  });

  it("returns 404 when the community does not exist", async () => {
    mockGetCommunityAccess.mockResolvedValue(null);
    const res = await POST(joinRequest("POST"), makeParams());

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Community not found", code: "not_found" });
  });

  it("returns 403 when the community is private", async () => {
    mockGetCommunityAccess.mockResolvedValue({ ...PUBLIC_ACCESS, visibility: "private" });
    const res = await POST(joinRequest("POST"), makeParams());

    expect(res.status).toBe(403);
  });

  it("returns 409 when already a member", async () => {
    mockGetMemberRole.mockResolvedValue("member");
    const res = await POST(joinRequest("POST"), makeParams());

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "Already a member", code: "conflict" });
  });
});

describe("/api/communities/[slug]/join — DELETE", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCommunityAccess.mockResolvedValue(PUBLIC_ACCESS);
    mockLeaveCommunity.mockResolvedValue(undefined);
  });

  it("returns 204 and leaves the community", async () => {
    const res = await DELETE(joinRequest("DELETE"), makeParams());

    expect(res.status).toBe(204);
    expect(mockLeaveCommunity).toHaveBeenCalledWith(COMMUNITY_ID, PLAYER_ID);
  });

  it("returns 403 when the owner tries to leave", async () => {
    routeEnv.signIn(testUser("user", { id: OWNER_ID }));
    const res = await DELETE(joinRequest("DELETE"), makeParams());

    expect(res.status).toBe(403);
    expect(mockLeaveCommunity).not.toHaveBeenCalled();
  });

  it("returns 401 when not authenticated", async () => {
    routeEnv.signOut();
    const res = await DELETE(joinRequest("DELETE"), makeParams());

    expect(res.status).toBe(401);
  });

  it("returns 404 when the community does not exist", async () => {
    mockGetCommunityAccess.mockResolvedValue(null);
    const res = await DELETE(joinRequest("DELETE"), makeParams());

    expect(res.status).toBe(404);
  });
});

describe("/api/communities/[slug]/join — rate limit", () => {
  it.each([
    ["POST", POST],
    ["DELETE", DELETE],
  ] as const)("%s returns 429 when the membership limit is exceeded", async (method, handler) => {
    routeEnv.exceedRateLimit(60);
    const res = await handler(joinRequest(method), makeParams());

    expect(res.status).toBe(429);
    expect(routeEnv.rateLimitHits[0]).toBe(`membership:user:${PLAYER_ID}`);
  });
});
