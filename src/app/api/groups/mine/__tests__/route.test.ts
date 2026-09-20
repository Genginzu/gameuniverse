import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const PLAYER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

const { mockFetchMyGroups, mockGetUser } = vi.hoisted(() => ({
  mockFetchMyGroups: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock("@/lib/services/groupServerService", () => ({
  GroupServerService: { fetchMyGroups: mockFetchMyGroups },
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from "@/app/api/groups/mine/route";

describe("/api/groups/mine — GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: PLAYER_ID } }, error: null });
    mockFetchMyGroups.mockResolvedValue([{ id: "g1", name: "Alpha Guild", slug: "alpha-guild" }]);
  });

  it("returns 200 with the current user's groups", async () => {
    const req = new NextRequest("http://localhost/api/groups/mine");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.groups).toHaveLength(1);
    expect(mockFetchMyGroups).toHaveBeenCalledWith(PLAYER_ID);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const req = new NextRequest("http://localhost/api/groups/mine");
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(mockFetchMyGroups).not.toHaveBeenCalled();
  });

  it("returns 500 on unexpected error", async () => {
    mockFetchMyGroups.mockRejectedValue(new Error("DB down"));
    const req = new NextRequest("http://localhost/api/groups/mine");
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});
