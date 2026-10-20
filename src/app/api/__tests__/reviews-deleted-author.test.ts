import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";

const { db, mockGetUser } = vi.hoisted(() => ({
  db: { current: null as ReturnType<typeof createSupabaseQueryMock> | null },
  mockGetUser: vi.fn(),
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({
    ...db.current!.client,
    auth: { getUser: mockGetUser },
  })),
}));
vi.mock("@/lib/utils/reviewVoteQueries", () => ({
  fetchVoteCountsMap: vi.fn(async () => new Map()),
  fetchUserVotesMap: vi.fn(async () => new Map()),
  enrichReviewsWithVotes: (reviews: object[]) =>
    reviews.map((r) => ({ ...r, voteCounts: { helpful: 0, notHelpful: 0 }, userVote: null })),
}));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { GET } = await import("@/app/api/reviews/route");

beforeEach(() => {
  db.current = createSupabaseQueryMock();
  mockGetUser.mockResolvedValue({ data: { user: null } });
});

describe("GET /api/reviews with an anonymised review", () => {
  it("keeps the review with a null author and never looks up a null profile", async () => {
    db.current!.enqueue("games", { data: { id: "game-1" } });
    db.current!.enqueue("game_reviews", {
      data: [
        {
          id: "review-1",
          user_id: null,
          game_id: "game-1",
          rating: 16,
          content: "<p>Great game</p>",
          positive_points: ["Story"],
          negative_points: [],
          created_at: "2026-10-01T10:00:00Z",
          updated_at: "2026-10-01T10:00:00Z",
        },
      ],
    });

    const res = await GET(new NextRequest("http://localhost/api/reviews?gameId=game-1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.totalCount).toBe(1);
    expect(body.averageRating).toBe(16);
    expect(body.reviews[0]).toMatchObject({ userId: null, playerName: null, rating: 16 });
    expect(db.current!.callsFor("profiles", "in")).toHaveLength(0);
  });
});
