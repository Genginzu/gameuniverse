import { describe, it, expect } from "vitest";
import { enrichReviewsWithVotes } from "../../../../src/lib/utils/reviewVoteQueries";
import type { Review, ReviewVoteCounts, VoteType } from "../../../../src/types/review";

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: "review-1",
    userId: "user-1",
    gameId: "game-1",
    rating: 4,
    content: "Great game",
    positivePoints: [],
    negativePoints: [],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    playerName: "Player",
    playerAvatar: null,
    ...overrides,
  };
}

describe("enrichReviewsWithVotes", () => {
  it("returns empty array for empty reviews", () => {
    const result = enrichReviewsWithVotes([], new Map(), new Map());
    expect(result).toEqual([]);
  });

  it("adds default vote counts and null userVote when no votes exist", () => {
    const reviews = [makeReview({ id: "r1" }), makeReview({ id: "r2" })];
    const result = enrichReviewsWithVotes(reviews, new Map(), new Map());

    expect(result).toHaveLength(2);
    expect(result[0].voteCounts).toEqual({ helpful: 0, notHelpful: 0 });
    expect(result[0].userVote).toBeNull();
    expect(result[1].voteCounts).toEqual({ helpful: 0, notHelpful: 0 });
    expect(result[1].userVote).toBeNull();
  });

  it("attaches vote counts from the map", () => {
    const reviews = [makeReview({ id: "r1" }), makeReview({ id: "r2" })];
    const voteCountsMap = new Map<string, ReviewVoteCounts>([
      ["r1", { helpful: 5, notHelpful: 2 }],
    ]);

    const result = enrichReviewsWithVotes(reviews, voteCountsMap, new Map());

    expect(result[0].voteCounts).toEqual({ helpful: 5, notHelpful: 2 });
    // r2 has no entry in the map → defaults
    expect(result[1].voteCounts).toEqual({ helpful: 0, notHelpful: 0 });
  });

  it("attaches user votes from the map", () => {
    const reviews = [makeReview({ id: "r1" }), makeReview({ id: "r2" })];
    const userVotesMap = new Map<string, VoteType>([["r1", "helpful"]]);

    const result = enrichReviewsWithVotes(reviews, new Map(), userVotesMap);

    expect(result[0].userVote).toBe("helpful");
    expect(result[1].userVote).toBeNull();
  });

  it("combines vote counts and user votes correctly", () => {
    const reviews = [makeReview({ id: "r1" }), makeReview({ id: "r2" }), makeReview({ id: "r3" })];
    const voteCountsMap = new Map<string, ReviewVoteCounts>([
      ["r1", { helpful: 10, notHelpful: 1 }],
      ["r3", { helpful: 0, notHelpful: 3 }],
    ]);
    const userVotesMap = new Map<string, VoteType>([
      ["r1", "helpful"],
      ["r2", "not_helpful"],
    ]);

    const result = enrichReviewsWithVotes(reviews, voteCountsMap, userVotesMap);

    expect(result[0].voteCounts).toEqual({ helpful: 10, notHelpful: 1 });
    expect(result[0].userVote).toBe("helpful");

    expect(result[1].voteCounts).toEqual({ helpful: 0, notHelpful: 0 });
    expect(result[1].userVote).toBe("not_helpful");

    expect(result[2].voteCounts).toEqual({ helpful: 0, notHelpful: 3 });
    expect(result[2].userVote).toBeNull();
  });

  it("preserves all original review fields", () => {
    const review = makeReview({
      id: "r1",
      content: "Specific content",
      rating: 5,
      playerName: "TestPlayer",
    });

    const result = enrichReviewsWithVotes([review], new Map(), new Map());

    expect(result[0].id).toBe("r1");
    expect(result[0].content).toBe("Specific content");
    expect(result[0].rating).toBe(5);
    expect(result[0].playerName).toBe("TestPlayer");
  });
});
