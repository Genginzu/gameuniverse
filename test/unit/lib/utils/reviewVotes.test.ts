import { describe, it, expect } from "vitest";
import {
  resolveVoteAfterClick,
  computeVoteCountsAfterChange,
} from "../../../../src/lib/utils/reviewVotes";
import type { ReviewVoteCounts, VoteType } from "../../../../src/types/review";

describe("resolveVoteAfterClick", () => {
  it("returns the clicked type when current vote is null", () => {
    expect(resolveVoteAfterClick(null, "helpful")).toBe("helpful");
    expect(resolveVoteAfterClick(null, "not_helpful")).toBe("not_helpful");
  });

  it("returns null when clicking the same vote type (toggle off)", () => {
    expect(resolveVoteAfterClick("helpful", "helpful")).toBeNull();
    expect(resolveVoteAfterClick("not_helpful", "not_helpful")).toBeNull();
  });

  it("returns the new type when clicking a different vote type", () => {
    expect(resolveVoteAfterClick("helpful", "not_helpful")).toBe("not_helpful");
    expect(resolveVoteAfterClick("not_helpful", "helpful")).toBe("helpful");
  });
});

describe("computeVoteCountsAfterChange", () => {
  const zeroCounts: ReviewVoteCounts = { helpful: 0, notHelpful: 0 };

  it("increments helpful when adding a helpful vote from no vote", () => {
    const result = computeVoteCountsAfterChange(zeroCounts, null, "helpful");
    expect(result).toEqual({ helpful: 1, notHelpful: 0 });
  });

  it("increments notHelpful when adding a not_helpful vote from no vote", () => {
    const result = computeVoteCountsAfterChange(zeroCounts, null, "not_helpful");
    expect(result).toEqual({ helpful: 0, notHelpful: 1 });
  });

  it("decrements helpful when removing a helpful vote", () => {
    const counts: ReviewVoteCounts = { helpful: 3, notHelpful: 1 };
    const result = computeVoteCountsAfterChange(counts, "helpful", null);
    expect(result).toEqual({ helpful: 2, notHelpful: 1 });
  });

  it("decrements notHelpful when removing a not_helpful vote", () => {
    const counts: ReviewVoteCounts = { helpful: 1, notHelpful: 5 };
    const result = computeVoteCountsAfterChange(counts, "not_helpful", null);
    expect(result).toEqual({ helpful: 1, notHelpful: 4 });
  });

  it("swaps from helpful to not_helpful", () => {
    const counts: ReviewVoteCounts = { helpful: 2, notHelpful: 1 };
    const result = computeVoteCountsAfterChange(counts, "helpful", "not_helpful");
    expect(result).toEqual({ helpful: 1, notHelpful: 2 });
  });

  it("swaps from not_helpful to helpful", () => {
    const counts: ReviewVoteCounts = { helpful: 1, notHelpful: 3 };
    const result = computeVoteCountsAfterChange(counts, "not_helpful", "helpful");
    expect(result).toEqual({ helpful: 2, notHelpful: 2 });
  });

  it("returns same counts when both previous and new are null", () => {
    const counts: ReviewVoteCounts = { helpful: 5, notHelpful: 3 };
    const result = computeVoteCountsAfterChange(counts, null, null);
    expect(result).toEqual({ helpful: 5, notHelpful: 3 });
  });

  it("never produces negative counts", () => {
    const result = computeVoteCountsAfterChange(zeroCounts, "helpful", null);
    expect(result).toEqual({ helpful: 0, notHelpful: 0 });
  });

  it("does not mutate the original counts object", () => {
    const counts: ReviewVoteCounts = { helpful: 2, notHelpful: 1 };
    computeVoteCountsAfterChange(counts, "helpful", "not_helpful");
    expect(counts).toEqual({ helpful: 2, notHelpful: 1 });
  });
});
