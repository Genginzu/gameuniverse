import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const USER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

const { mockGetUser, mockFetchFriendsFeed } = vi.hoisted(() => ({
  mockGetUser: vi.fn(() =>
    Promise.resolve({
      data: { user: { id: USER_ID } },
    })
  ),
  mockFetchFriendsFeed: vi.fn(() =>
    Promise.resolve({
      events: [
        {
          id: "evt-1",
          type: "review",
          date: "2024-03-01T12:00:00Z",
          data: {
            type: "review",
            gameId: "g1",
            gameSlug: "zelda",
            gameName: "Zelda",
            rating: 18,
            contentExcerpt: "Excellent",
            actor: { id: "u1", username: "alice", avatarUrl: null },
          },
        },
      ],
      pagination: { currentPage: 1, totalPages: 1, hasNextPage: false },
    })
  ),
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
    })
  ),
}));

vi.mock("@/lib/services/friendsFeedServerService", () => ({
  FriendsFeedServerService: {
    fetchFriendsFeed: mockFetchFriendsFeed,
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from "@/app/api/feed/route";

function makeRequest(url = "http://localhost/api/feed") {
  return new NextRequest(url);
}

describe("/api/feed", () => {
  beforeEach(() => {
    mockGetUser.mockReset().mockResolvedValue({ data: { user: { id: USER_ID } } });
    mockFetchFriendsFeed.mockReset().mockResolvedValue({
      events: [
        {
          id: "evt-1",
          type: "review",
          date: "2024-03-01T12:00:00Z",
          data: {
            type: "review",
            gameId: "g1",
            gameSlug: "zelda",
            gameName: "Zelda",
            rating: 18,
            contentExcerpt: "Excellent",
            actor: { id: "u1", username: "alice", avatarUrl: null },
          },
        },
      ],
      pagination: { currentPage: 1, totalPages: 1, hasNextPage: false },
    });
  });

  it("should return 200 with feed events on success", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.events).toHaveLength(1);
    expect(body.events[0].type).toBe("review");
    expect(body.pagination.currentPage).toBe(1);
  });

  it("should return 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("should return 500 on unexpected error", async () => {
    mockFetchFriendsFeed.mockRejectedValue(new Error("DB down"));
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });

  it("should default page to 1 and locale to fr", async () => {
    await GET(makeRequest());
    expect(mockFetchFriendsFeed).toHaveBeenCalledWith(USER_ID, "fr", null, 1);
  });

  it("should pass page, locale, and type query parameters", async () => {
    await GET(makeRequest("http://localhost/api/feed?page=3&type=review&locale=en"));
    expect(mockFetchFriendsFeed).toHaveBeenCalledWith(USER_ID, "en", "review", 3);
  });

  it("should ignore invalid type filter and pass null", async () => {
    await GET(makeRequest("http://localhost/api/feed?type=invalid"));
    expect(mockFetchFriendsFeed).toHaveBeenCalledWith(USER_ID, "fr", null, 1);
  });

  it("should normalize invalid page to 1", async () => {
    await GET(makeRequest("http://localhost/api/feed?page=-5"));
    expect(mockFetchFriendsFeed).toHaveBeenCalledWith(USER_ID, "fr", null, 1);
  });

  it("should pass null type when no type param provided", async () => {
    await GET(makeRequest("http://localhost/api/feed?page=2&locale=en"));
    expect(mockFetchFriendsFeed).toHaveBeenCalledWith(USER_ID, "en", null, 2);
  });
});
