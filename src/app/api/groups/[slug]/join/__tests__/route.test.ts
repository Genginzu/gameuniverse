import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";

const GROUP_ID = "gggggggg-gggg-4ggg-gggg-gggggggggggg";
const OWNER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const PLAYER_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const SLUG = "rpg-fans";

const { mockGetGroupAccess, mockGetMemberRole, mockJoinGroup, mockLeaveGroup } = vi.hoisted(
  () => ({
    mockGetGroupAccess: vi.fn(),
    mockGetMemberRole: vi.fn(),
    mockJoinGroup: vi.fn(),
    mockLeaveGroup: vi.fn(),
  })
);

const routeEnv = useTestRouteEnvironment({ signedInAs: testUser("user", { id: PLAYER_ID }) });

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

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST, DELETE } from "@/app/api/groups/[slug]/join/route";

function makeParams(slug = SLUG): { params: Promise<{ slug: string }> } {
  return { params: Promise.resolve({ slug }) };
}

function joinRequest(method: "POST" | "DELETE") {
  return new NextRequest(`http://localhost/api/groups/${SLUG}/join`, { method });
}

describe("/api/groups/[slug]/join — POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetGroupAccess.mockResolvedValue({ id: GROUP_ID, visibility: "public", ownerId: OWNER_ID });
    mockGetMemberRole.mockResolvedValue(null);
    mockJoinGroup.mockResolvedValue(undefined);
  });

  it("returns 201 and joins the group", async () => {
    const res = await POST(joinRequest("POST"), makeParams());

    expect(res.status).toBe(201);
    expect(mockJoinGroup).toHaveBeenCalledWith(GROUP_ID, PLAYER_ID);
  });

  it("returns 401 when not authenticated", async () => {
    routeEnv.signOut();
    const res = await POST(joinRequest("POST"), makeParams());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Authentication required", code: "unauthorized" });
  });

  it("returns 404 when the group does not exist", async () => {
    mockGetGroupAccess.mockResolvedValue(null);
    const res = await POST(joinRequest("POST"), makeParams());

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Group not found", code: "not_found" });
  });

  it("returns 403 when the group is private", async () => {
    mockGetGroupAccess.mockResolvedValue({ id: GROUP_ID, visibility: "private", ownerId: OWNER_ID });
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

describe("/api/groups/[slug]/join — DELETE", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetGroupAccess.mockResolvedValue({ id: GROUP_ID, visibility: "public", ownerId: OWNER_ID });
    mockLeaveGroup.mockResolvedValue(undefined);
  });

  it("returns 204 and leaves the group", async () => {
    const res = await DELETE(joinRequest("DELETE"), makeParams());

    expect(res.status).toBe(204);
    expect(mockLeaveGroup).toHaveBeenCalledWith(GROUP_ID, PLAYER_ID);
  });

  it("returns 403 when the owner tries to leave", async () => {
    routeEnv.signIn(testUser("user", { id: OWNER_ID }));
    const res = await DELETE(joinRequest("DELETE"), makeParams());

    expect(res.status).toBe(403);
    expect(mockLeaveGroup).not.toHaveBeenCalled();
  });

  it("returns 401 when not authenticated", async () => {
    routeEnv.signOut();
    const res = await DELETE(joinRequest("DELETE"), makeParams());

    expect(res.status).toBe(401);
  });

  it("returns 404 when the group does not exist", async () => {
    mockGetGroupAccess.mockResolvedValue(null);
    const res = await DELETE(joinRequest("DELETE"), makeParams());

    expect(res.status).toBe(404);
  });
});

describe("/api/groups/[slug]/join — rate limit", () => {
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
