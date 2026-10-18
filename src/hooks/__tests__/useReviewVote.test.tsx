import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReviewVote } from "../useReviewVote";
import type { ReviewVoteCounts, VoteType } from "@/types/review";

const mocks = vi.hoisted(() => ({
  user: null as { id: string } | null,
  submitVote: vi.fn(),
  removeVote: vi.fn(),
}));

vi.mock("../useAuth", () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock("@/lib/services/reviewVoteService", () => ({
  ReviewVoteService: { submitVote: mocks.submitVote, removeVote: mocks.removeVote },
}));

const REVIEW_ID = "review-1";
const AUTHOR_ID = "author-1";

function renderVoteHook(
  counts: ReviewVoteCounts = { helpful: 3, notHelpful: 1 },
  userVote: VoteType | null = null
) {
  return renderHook(() => useReviewVote(REVIEW_ID, AUTHOR_ID, counts, userVote));
}

describe("useReviewVote", () => {
  beforeEach(() => {
    mocks.user = { id: "voter-1" };
    mocks.submitVote.mockReset().mockResolvedValue(undefined);
    mocks.removeVote.mockReset().mockResolvedValue(undefined);
  });

  it("exposes the initial counts and vote", () => {
    const { result } = renderVoteHook({ helpful: 5, notHelpful: 2 }, "helpful");
    expect(result.current).toMatchObject({
      voteCounts: { helpful: 5, notHelpful: 2 },
      userVote: "helpful",
      isVoting: false,
      error: null,
    });
  });

  it("ignores votes from anonymous visitors", async () => {
    mocks.user = null;
    const { result } = renderVoteHook();
    await act(() => result.current.handleVote("helpful"));
    expect(mocks.submitVote).not.toHaveBeenCalled();
    expect(result.current.voteCounts).toEqual({ helpful: 3, notHelpful: 1 });
  });

  it("ignores votes on the user's own review", async () => {
    mocks.user = { id: AUTHOR_ID };
    const { result } = renderVoteHook();
    await act(() => result.current.handleVote("helpful"));
    expect(mocks.submitVote).not.toHaveBeenCalled();
  });

  it("submits a new vote and keeps the optimistic counts", async () => {
    const { result } = renderVoteHook();
    await act(() => result.current.handleVote("helpful"));

    expect(mocks.submitVote).toHaveBeenCalledWith(REVIEW_ID, "helpful");
    expect(result.current.userVote).toBe("helpful");
    expect(result.current.voteCounts).toEqual({ helpful: 4, notHelpful: 1 });
    expect(result.current.isVoting).toBe(false);
  });

  it("switches an existing vote to the other type", async () => {
    const { result } = renderVoteHook({ helpful: 5, notHelpful: 2 }, "helpful");
    await act(() => result.current.handleVote("not_helpful"));

    expect(mocks.submitVote).toHaveBeenCalledWith(REVIEW_ID, "not_helpful");
    expect(result.current.voteCounts).toEqual({ helpful: 4, notHelpful: 3 });
  });

  it("removes the vote when clicking the same type again", async () => {
    const { result } = renderVoteHook({ helpful: 5, notHelpful: 2 }, "helpful");
    await act(() => result.current.handleVote("helpful"));

    expect(mocks.removeVote).toHaveBeenCalledWith(REVIEW_ID);
    expect(mocks.submitVote).not.toHaveBeenCalled();
    expect(result.current.userVote).toBeNull();
    expect(result.current.voteCounts).toEqual({ helpful: 4, notHelpful: 2 });
  });

  it("rolls back and exposes the error message when the API fails", async () => {
    mocks.submitVote.mockRejectedValue(new Error("Failed to submit vote"));
    const { result } = renderVoteHook();
    await act(() => result.current.handleVote("helpful"));

    expect(result.current.userVote).toBeNull();
    expect(result.current.voteCounts).toEqual({ helpful: 3, notHelpful: 1 });
    expect(result.current.error).toBe("Failed to submit vote");
    expect(result.current.isVoting).toBe(false);
  });

  it("uses a generic message for non-Error rejections", async () => {
    mocks.submitVote.mockRejectedValue("boom");
    const { result } = renderVoteHook();
    await act(() => result.current.handleVote("helpful"));
    expect(result.current.error).toBe("An error occurred");
  });

  it("clears a previous error on the next vote", async () => {
    mocks.submitVote.mockRejectedValueOnce(new Error("first failure"));
    const { result } = renderVoteHook();
    await act(() => result.current.handleVote("helpful"));
    await act(() => result.current.handleVote("helpful"));
    expect(result.current.error).toBeNull();
  });

  it("ignores a second vote while the first one is in flight", async () => {
    let resolveFirst: () => void = () => {};
    mocks.submitVote.mockImplementationOnce(
      () => new Promise<void>((resolve) => (resolveFirst = resolve))
    );
    const { result } = renderVoteHook();

    let firstVote: Promise<void> = Promise.resolve();
    act(() => {
      firstVote = result.current.handleVote("helpful");
    });
    expect(result.current.isVoting).toBe(true);

    await act(() => result.current.handleVote("not_helpful"));
    expect(mocks.submitVote).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFirst();
      await firstVote;
    });
    expect(result.current.isVoting).toBe(false);
  });
});
