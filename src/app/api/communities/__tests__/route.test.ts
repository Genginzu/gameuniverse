import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";

const OWNER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

const { mockSearchCommunities, mockCreateCommunity } = vi.hoisted(() => ({
  mockSearchCommunities: vi.fn(),
  mockCreateCommunity: vi.fn(),
}));

const routeEnv = useTestRouteEnvironment({ signedInAs: testUser("user", { id: OWNER_ID }) });

vi.mock("@/lib/services/communityServerService", () => ({
  CommunityServerService: {
    searchCommunities: mockSearchCommunities,
    createCommunity: mockCreateCommunity,
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET, POST } from "@/app/api/communities/route";

const SAMPLE_COMMUNITY = {
  id: "c1",
  name: "RPG Community",
  slug: "rpg-community",
  description: null,
  imageUrl: null,
  visibility: "public",
  gameId: null,
  genreId: null,
  gameName: null,
  genreName: null,
  membersCount: 1,
  ownerId: OWNER_ID,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

function createRequest(body: object) {
  return new NextRequest("http://localhost/api/communities", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("/api/communities — GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchCommunities.mockResolvedValue({ communities: [SAMPLE_COMMUNITY], totalCount: 1 });
  });

  it("returns 200 with communities and pagination", async () => {
    const req = new NextRequest("http://localhost/api/communities");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.communities).toHaveLength(1);
    expect(body.pagination).toEqual({
      currentPage: 1,
      totalPages: 1,
      totalCount: 1,
      hasNextPage: false,
    });
  });

  it("passes search/gameId/genreId/page to the service", async () => {
    const req = new NextRequest(
      "http://localhost/api/communities?search=rpg&gameId=g1&genreId=gen1&page=2"
    );
    await GET(req);

    expect(mockSearchCommunities).toHaveBeenCalledWith({
      search: "rpg",
      gameId: "g1",
      genreId: "gen1",
      page: 2,
    });
  });

  it("returns 500 on unexpected error", async () => {
    mockSearchCommunities.mockRejectedValue(new Error("DB down"));
    const req = new NextRequest("http://localhost/api/communities");
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});

describe("/api/communities — POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateCommunity.mockResolvedValue(SAMPLE_COMMUNITY);
  });

  it("returns 201 with the created community", async () => {
    const res = await POST(createRequest({ name: "RPG Community" }));

    expect(res.status).toBe(201);
    expect(mockCreateCommunity).toHaveBeenCalledWith(
      OWNER_ID,
      expect.objectContaining({ name: "RPG Community" })
    );
  });

  it("returns 401 when not authenticated", async () => {
    routeEnv.signOut();
    const res = await POST(createRequest({ name: "RPG Community" }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Authentication required", code: "unauthorized" });
  });

  it("returns 400 on invalid input", async () => {
    const res = await POST(createRequest({ name: "" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: "validation" });
  });

  it("returns 403 when the account is suspended", async () => {
    routeEnv.suspend("2099-01-01T00:00:00Z");
    const res = await POST(createRequest({ name: "RPG Community" }));

    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: "suspended" });
    expect(mockCreateCommunity).not.toHaveBeenCalled();
  });

  it("returns 429 when the groupCreate rate limit is exceeded", async () => {
    routeEnv.exceedRateLimit(60);
    const res = await POST(createRequest({ name: "RPG Community" }));

    expect(res.status).toBe(429);
    expect(routeEnv.rateLimitHits[0]).toContain("groupCreate");
    expect(mockCreateCommunity).not.toHaveBeenCalled();
  });
});
