import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const OWNER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

const { mockSearchGroups, mockCreateGroup, mockGetUser } = vi.hoisted(() => ({
  mockSearchGroups: vi.fn(),
  mockCreateGroup: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock("@/lib/services/groupServerService", () => ({
  GroupServerService: {
    searchGroups: mockSearchGroups,
    createGroup: mockCreateGroup,
  },
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET, POST } from "@/app/api/groups/route";

const SAMPLE_GROUP = {
  id: "g1",
  name: "RPG Fans",
  slug: "rpg-fans",
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

describe("/api/groups — GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchGroups.mockResolvedValue({ groups: [SAMPLE_GROUP], totalCount: 1 });
  });

  it("returns 200 with groups and pagination", async () => {
    const req = new NextRequest("http://localhost/api/groups");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.groups).toHaveLength(1);
    expect(body.pagination).toEqual({
      currentPage: 1,
      totalPages: 1,
      totalCount: 1,
      hasNextPage: false,
    });
  });

  it("passes search/gameId/genreId/page to the service", async () => {
    const req = new NextRequest(
      "http://localhost/api/groups?search=rpg&gameId=g1&genreId=gen1&page=2"
    );
    await GET(req);

    expect(mockSearchGroups).toHaveBeenCalledWith({
      search: "rpg",
      gameId: "g1",
      genreId: "gen1",
      page: 2,
    });
  });

  it("returns 500 on unexpected error", async () => {
    mockSearchGroups.mockRejectedValue(new Error("DB down"));
    const req = new NextRequest("http://localhost/api/groups");
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});

describe("/api/groups — POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: OWNER_ID } }, error: null });
    mockCreateGroup.mockResolvedValue(SAMPLE_GROUP);
  });

  it("returns 201 with the created group", async () => {
    const req = new NextRequest("http://localhost/api/groups", {
      method: "POST",
      body: JSON.stringify({ name: "RPG Fans" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockCreateGroup).toHaveBeenCalledWith(OWNER_ID, expect.objectContaining({ name: "RPG Fans" }));
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const req = new NextRequest("http://localhost/api/groups", {
      method: "POST",
      body: JSON.stringify({ name: "RPG Fans" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid input", async () => {
    const req = new NextRequest("http://localhost/api/groups", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});
