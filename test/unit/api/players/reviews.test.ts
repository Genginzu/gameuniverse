import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const PLAYER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

const mockReview = {
  id: "review-1",
  gameId: "game-1",
  gameSlug: "zelda",
  gameName: "Zelda",
  gameCoverUrl: "/covers/zelda.jpg",
  rating: 18,
  content: "<p>Excellent game</p>",
  positivePoints: ["Great story"],
  negativePoints: ["Too short"],
  createdAt: "2024-03-01T12:00:00Z",
  updatedAt: "2024-03-01T12:00:00Z",
};

const mockStats = {
  totalCount: 1,
  averageRating: 18,
  distribution: [
    { range: "0-5", count: 0, percentage: 0 },
    { range: "6-10", count: 0, percentage: 0 },
    { range: "11-15", count: 0, percentage: 0 },
    { range: "16-20", count: 1, percentage: 100 },
  ],
};

const {
  mockValidatePlayerId,
  mockPlayerExists,
  mockFetchPlayerReviews,
  mockFetchPlayerReviewsStats,
} = vi.hoisted(() => ({
  mockValidatePlayerId: vi.fn(() => true),
  mockPlayerExists: vi.fn(() => Promise.resolve(true)),
  mockFetchPlayerReviews: vi.fn(() => Promise.resolve({ reviews: [mockReview], totalCount: 1 })),
  mockFetchPlayerReviewsStats: vi.fn(() => Promise.resolve(mockStats)),
}));

vi.mock("../../../../src/lib/services/playerService", () => ({
  PlayerService: {
    validatePlayerId: mockValidatePlayerId,
    playerExists: mockPlayerExists,
  },
}));

vi.mock("../../../../src/lib/services/playerReviewsServerService", () => ({
  PlayerReviewsServerService: {
    fetchPlayerReviews: mockFetchPlayerReviews,
    fetchPlayerReviewsStats: mockFetchPlayerReviewsStats,
  },
}));

vi.mock("../../../../src/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from "../../../../src/app/api/players/[id]/reviews/route";

function makeParams(id = PLAYER_ID): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe("/api/players/[id]/reviews", () => {
  beforeEach(() => {
    mockValidatePlayerId.mockReset().mockReturnValue(true);
    mockPlayerExists.mockReset().mockResolvedValue(true);
    mockFetchPlayerReviews.mockReset().mockResolvedValue({
      reviews: [mockReview],
      totalCount: 1,
    });
    mockFetchPlayerReviewsStats.mockReset().mockResolvedValue(mockStats);
  });

  it("should return 200 with reviews and stats on success", async () => {
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/reviews`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reviews).toHaveLength(1);
    expect(body.reviews[0].id).toBe("review-1");
    expect(body.reviews[0].rating).toBe(18);
    expect(body.stats.totalCount).toBe(1);
    expect(body.stats.averageRating).toBe(18);
    expect(body.stats.distribution).toHaveLength(4);
    expect(body.pagination.currentPage).toBe(1);
    expect(body.pagination.totalPages).toBe(1);
    expect(body.pagination.hasNextPage).toBe(false);
  });

  it("should return 404 when player does not exist", async () => {
    mockPlayerExists.mockResolvedValue(false);
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/reviews`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Player not found");
  });

  it("should return 400 for invalid UUID", async () => {
    mockValidatePlayerId.mockReturnValue(false);
    const req = new NextRequest("http://localhost/api/players/not-a-uuid/reviews");
    const res = await GET(req, makeParams("not-a-uuid"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Format d'identifiant invalide");
  });

  it("should fallback to date_desc for invalid sort parameter", async () => {
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/reviews?sort=invalid`);
    await GET(req, makeParams());
    expect(mockFetchPlayerReviews).toHaveBeenCalledWith(PLAYER_ID, "fr", "date_desc", 1);
  });

  it("should return 500 on server error", async () => {
    mockFetchPlayerReviews.mockRejectedValue(new Error("DB down"));
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/reviews`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });

  it("should not fetch stats for page > 1", async () => {
    mockFetchPlayerReviews.mockResolvedValue({ reviews: [], totalCount: 25 });
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/reviews?page=2`);
    const res = await GET(req, makeParams());
    expect(res.status).toBe(200);
    expect(mockFetchPlayerReviewsStats).not.toHaveBeenCalled();
    const body = await res.json();
    expect(body.stats.totalCount).toBe(0);
    expect(body.stats.averageRating).toBeNull();
  });
});
