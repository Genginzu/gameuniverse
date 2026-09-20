import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const PLAYER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

const { mockFetchMyCommunities, mockGetUser } = vi.hoisted(() => ({
  mockFetchMyCommunities: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock("@/lib/services/communityServerService", () => ({
  CommunityServerService: { fetchMyCommunities: mockFetchMyCommunities },
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from "@/app/api/communities/mine/route";

describe("/api/communities/mine — GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: PLAYER_ID } }, error: null });
    mockFetchMyCommunities.mockResolvedValue([
      { id: "c1", name: "Alpha Community", slug: "alpha-community" },
    ]);
  });

  it("returns 200 with the current user's communities", async () => {
    const req = new NextRequest("http://localhost/api/communities/mine");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.communities).toHaveLength(1);
    expect(mockFetchMyCommunities).toHaveBeenCalledWith(PLAYER_ID);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const req = new NextRequest("http://localhost/api/communities/mine");
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(mockFetchMyCommunities).not.toHaveBeenCalled();
  });

  it("returns 500 on unexpected error", async () => {
    mockFetchMyCommunities.mockRejectedValue(new Error("DB down"));
    const req = new NextRequest("http://localhost/api/communities/mine");
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});
