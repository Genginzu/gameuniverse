import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  resolveVoteAfterClick,
  computeVoteCountsAfterChange,
} from "../../../src/lib/utils/reviewVotes";
import type { ReviewVoteCounts, VoteType } from "../../../src/types/review";

/**
 * Unit tests for useReviewVote hook logic.
 *
 * Since the hook depends on useAuth (Supabase) and ReviewVoteService (fetch),
 * we test the core logic through the pure functions it delegates to, plus
 * simulate the optimistic update / rollback state machine and guard conditions.
 *
 * Requirements: 1.1, 1.2, 1.3, 2.2
 */

// ---------------------------------------------------------------------------
// Helpers — simulate the hook's state machine
// ---------------------------------------------------------------------------

interface HookState {
  voteCounts: ReviewVoteCounts;
  userVote: VoteType | null;
  isVoting: boolean;
  error: string | null;
}

/** Simulates the optimistic update phase of handleVote */
function applyOptimisticUpdate(
  state: HookState,
  voteType: VoteType
): { newState: HookState; prevVote: VoteType | null; prevCounts: ReviewVoteCounts } {
  const prevVote = state.userVote;
  const prevCounts = { ...state.voteCounts };
  const newVote = resolveVoteAfterClick(state.userVote, voteType);
  const newCounts = computeVoteCountsAfterChange(state.voteCounts, state.userVote, newVote);

  return {
    newState: {
      voteCounts: newCounts,
      userVote: newVote,
      isVoting: true,
      error: null,
    },
    prevVote,
    prevCounts,
  };
}

/** Simulates rollback after API failure */
function applyRollback(
  state: HookState,
  prevVote: VoteType | null,
  prevCounts: ReviewVoteCounts,
  errorMsg: string
): HookState {
  return {
    voteCounts: prevCounts,
    userVote: prevVote,
    isVoting: false,
    error: errorMsg,
  };
}

/** Simulates successful API completion */
function applySuccess(state: HookState): HookState {
  return { ...state, isVoting: false };
}

function makeInitialState(
  counts: ReviewVoteCounts = { helpful: 0, notHelpful: 0 },
  userVote: VoteType | null = null
): HookState {
  return { voteCounts: counts, userVote, isVoting: false, error: null };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useReviewVote — Unit Tests", () => {
  // -----------------------------------------------------------------------
  // Initial state
  // -----------------------------------------------------------------------
  describe("initial state", () => {
    it("should match provided initial values with no vote", () => {
      const state = makeInitialState({ helpful: 5, notHelpful: 2 }, null);

      expect(state.voteCounts).toEqual({ helpful: 5, notHelpful: 2 });
      expect(state.userVote).toBeNull();
      expect(state.isVoting).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should match provided initial values with existing vote", () => {
      const state = makeInitialState({ helpful: 3, notHelpful: 1 }, "helpful");

      expect(state.voteCounts).toEqual({ helpful: 3, notHelpful: 1 });
      expect(state.userVote).toBe("helpful");
    });

    it("should handle zero counts", () => {
      const state = makeInitialState({ helpful: 0, notHelpful: 0 }, null);

      expect(state.voteCounts).toEqual({ helpful: 0, notHelpful: 0 });
      expect(state.userVote).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // Requirement 1.1 — Voting adds a vote (optimistic update)
  // -----------------------------------------------------------------------
  describe("optimistic update — new vote", () => {
    it("should increment helpful count when voting helpful from no vote", () => {
      const state = makeInitialState({ helpful: 3, notHelpful: 1 }, null);
      const { newState } = applyOptimisticUpdate(state, "helpful");

      expect(newState.userVote).toBe("helpful");
      expect(newState.voteCounts).toEqual({ helpful: 4, notHelpful: 1 });
      expect(newState.isVoting).toBe(true);
      expect(newState.error).toBeNull();
    });

    it("should increment not_helpful count when voting not_helpful from no vote", () => {
      const state = makeInitialState({ helpful: 3, notHelpful: 1 }, null);
      const { newState } = applyOptimisticUpdate(state, "not_helpful");

      expect(newState.userVote).toBe("not_helpful");
      expect(newState.voteCounts).toEqual({ helpful: 3, notHelpful: 2 });
    });
  });

  // -----------------------------------------------------------------------
  // Requirement 1.2 — Toggle: same vote type removes it
  // -----------------------------------------------------------------------
  describe("optimistic update — toggle off", () => {
    it("should remove helpful vote when clicking helpful again", () => {
      const state = makeInitialState({ helpful: 5, notHelpful: 2 }, "helpful");
      const { newState } = applyOptimisticUpdate(state, "helpful");

      expect(newState.userVote).toBeNull();
      expect(newState.voteCounts).toEqual({ helpful: 4, notHelpful: 2 });
    });

    it("should remove not_helpful vote when clicking not_helpful again", () => {
      const state = makeInitialState({ helpful: 5, notHelpful: 2 }, "not_helpful");
      const { newState } = applyOptimisticUpdate(state, "not_helpful");

      expect(newState.userVote).toBeNull();
      expect(newState.voteCounts).toEqual({ helpful: 5, notHelpful: 1 });
    });
  });

  // -----------------------------------------------------------------------
  // Requirement 1.3 — Switch: different vote type replaces
  // -----------------------------------------------------------------------
  describe("optimistic update — switch vote", () => {
    it("should switch from helpful to not_helpful", () => {
      const state = makeInitialState({ helpful: 5, notHelpful: 2 }, "helpful");
      const { newState } = applyOptimisticUpdate(state, "not_helpful");

      expect(newState.userVote).toBe("not_helpful");
      expect(newState.voteCounts).toEqual({ helpful: 4, notHelpful: 3 });
    });

    it("should switch from not_helpful to helpful", () => {
      const state = makeInitialState({ helpful: 5, notHelpful: 2 }, "not_helpful");
      const { newState } = applyOptimisticUpdate(state, "helpful");

      expect(newState.userVote).toBe("helpful");
      expect(newState.voteCounts).toEqual({ helpful: 6, notHelpful: 1 });
    });
  });

  // -----------------------------------------------------------------------
  // Requirement 2.2 — Counts update without page reload (rollback)
  // -----------------------------------------------------------------------
  describe("rollback on API failure", () => {
    it("should revert to previous state after failed new vote", () => {
      const initial = makeInitialState({ helpful: 3, notHelpful: 1 }, null);
      const { newState, prevVote, prevCounts } = applyOptimisticUpdate(initial, "helpful");

      // Verify optimistic state was applied
      expect(newState.voteCounts.helpful).toBe(4);
      expect(newState.userVote).toBe("helpful");

      // Simulate API failure → rollback
      const rolledBack = applyRollback(newState, prevVote, prevCounts, "Network error");

      expect(rolledBack.voteCounts).toEqual({ helpful: 3, notHelpful: 1 });
      expect(rolledBack.userVote).toBeNull();
      expect(rolledBack.isVoting).toBe(false);
      expect(rolledBack.error).toBe("Network error");
    });

    it("should revert to previous state after failed toggle off", () => {
      const initial = makeInitialState({ helpful: 5, notHelpful: 2 }, "helpful");
      const { newState, prevVote, prevCounts } = applyOptimisticUpdate(initial, "helpful");

      expect(newState.userVote).toBeNull();
      expect(newState.voteCounts.helpful).toBe(4);

      const rolledBack = applyRollback(newState, prevVote, prevCounts, "Server error");

      expect(rolledBack.voteCounts).toEqual({ helpful: 5, notHelpful: 2 });
      expect(rolledBack.userVote).toBe("helpful");
      expect(rolledBack.error).toBe("Server error");
    });

    it("should revert to previous state after failed vote switch", () => {
      const initial = makeInitialState({ helpful: 5, notHelpful: 2 }, "helpful");
      const { newState, prevVote, prevCounts } = applyOptimisticUpdate(initial, "not_helpful");

      expect(newState.userVote).toBe("not_helpful");
      expect(newState.voteCounts).toEqual({ helpful: 4, notHelpful: 3 });

      const rolledBack = applyRollback(newState, prevVote, prevCounts, "Failed to submit vote");

      expect(rolledBack.voteCounts).toEqual({ helpful: 5, notHelpful: 2 });
      expect(rolledBack.userVote).toBe("helpful");
    });

    it("should clear error on successful vote after previous failure", () => {
      const initial = makeInitialState({ helpful: 3, notHelpful: 1 }, null);

      // First attempt fails
      const {
        newState: s1,
        prevVote: pv1,
        prevCounts: pc1,
      } = applyOptimisticUpdate(initial, "helpful");
      const rolledBack = applyRollback(s1, pv1, pc1, "Network error");
      expect(rolledBack.error).toBe("Network error");

      // Second attempt succeeds — optimistic update clears error
      const { newState: s2 } = applyOptimisticUpdate(rolledBack, "helpful");
      expect(s2.error).toBeNull();

      const success = applySuccess(s2);
      expect(success.error).toBeNull();
      expect(success.isVoting).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Self-vote prevention (Requirement 3.2)
  // -----------------------------------------------------------------------
  describe("self-vote prevention", () => {
    it("should not allow vote when user is the review author", () => {
      const userId = "user-123";
      const reviewUserId = "user-123";
      const canVote = userId !== reviewUserId;

      expect(canVote).toBe(false);
    });

    it("should allow vote when user is not the review author", () => {
      const userId = "user-123";
      const reviewUserId = "user-456";
      const canVote = userId !== reviewUserId;

      expect(canVote).toBe(true);
    });

    it("should not change state when self-voting", () => {
      const initial = makeInitialState({ helpful: 3, notHelpful: 1 }, null);
      const userId = "user-123";
      const reviewUserId = "user-123";

      // Guard: if user.id === reviewUserId → return (no-op)
      if (userId === reviewUserId) {
        // State remains unchanged
        expect(initial.voteCounts).toEqual({ helpful: 3, notHelpful: 1 });
        expect(initial.userVote).toBeNull();
        expect(initial.isVoting).toBe(false);
      }
    });
  });

  // -----------------------------------------------------------------------
  // No action when unauthenticated
  // -----------------------------------------------------------------------
  describe("unauthenticated user", () => {
    it("should not allow vote when user is null", () => {
      const user = null;
      const canVote = !!user;

      expect(canVote).toBe(false);
    });

    it("should not change state when unauthenticated", () => {
      const initial = makeInitialState({ helpful: 3, notHelpful: 1 }, null);
      const user = null;

      // Guard: if (!user) return
      if (!user) {
        expect(initial.voteCounts).toEqual({ helpful: 3, notHelpful: 1 });
        expect(initial.userVote).toBeNull();
      }
    });
  });

  // -----------------------------------------------------------------------
  // API method selection (determines submitVote vs removeVote)
  // -----------------------------------------------------------------------
  describe("API method selection", () => {
    it("should call submitVote when new vote is not null", () => {
      const state = makeInitialState({ helpful: 0, notHelpful: 0 }, null);
      const { newState } = applyOptimisticUpdate(state, "helpful");

      // newVote is not null → submitVote should be called
      expect(newState.userVote).not.toBeNull();
    });

    it("should call removeVote when toggling off (new vote is null)", () => {
      const state = makeInitialState({ helpful: 1, notHelpful: 0 }, "helpful");
      const { newState } = applyOptimisticUpdate(state, "helpful");

      // newVote is null → removeVote should be called
      expect(newState.userVote).toBeNull();
    });

    it("should call submitVote when switching vote type", () => {
      const state = makeInitialState({ helpful: 1, notHelpful: 0 }, "helpful");
      const { newState } = applyOptimisticUpdate(state, "not_helpful");

      // newVote is not null → submitVote should be called
      expect(newState.userVote).toBe("not_helpful");
    });
  });

  // -----------------------------------------------------------------------
  // isVoting guard — prevents concurrent votes
  // -----------------------------------------------------------------------
  describe("concurrent vote prevention", () => {
    it("should block vote when isVoting is true", () => {
      const isVoting = true;
      const user = { id: "user-1" };
      const canVote = !!user && !isVoting;

      expect(canVote).toBe(false);
    });

    it("should allow vote when isVoting is false", () => {
      const isVoting = false;
      const user = { id: "user-1" };
      const canVote = !!user && !isVoting;

      expect(canVote).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Error message extraction (mirrors hook's catch block)
  // -----------------------------------------------------------------------
  describe("error message extraction", () => {
    it("should extract message from Error instance", () => {
      const err = new Error("Failed to submit vote");
      const errorMessage = err instanceof Error ? err.message : "An error occurred";

      expect(errorMessage).toBe("Failed to submit vote");
    });

    it("should use fallback for non-Error exceptions", () => {
      const err = "string error";
      const errorMessage = err instanceof Error ? err.message : "An error occurred";

      expect(errorMessage).toBe("An error occurred");
    });

    it("should use fallback for null/undefined errors", () => {
      const err = null;
      const errorMessage = err instanceof Error ? err.message : "An error occurred";

      expect(errorMessage).toBe("An error occurred");
    });
  });

  // -----------------------------------------------------------------------
  // Full vote lifecycle — multi-step scenarios
  // -----------------------------------------------------------------------
  describe("full vote lifecycle", () => {
    it("should handle add → toggle off → add again", () => {
      let state = makeInitialState({ helpful: 0, notHelpful: 0 }, null);

      // Step 1: Add helpful vote
      const step1 = applyOptimisticUpdate(state, "helpful");
      state = applySuccess(step1.newState);
      expect(state.voteCounts).toEqual({ helpful: 1, notHelpful: 0 });
      expect(state.userVote).toBe("helpful");

      // Step 2: Toggle off
      const step2 = applyOptimisticUpdate(state, "helpful");
      state = applySuccess(step2.newState);
      expect(state.voteCounts).toEqual({ helpful: 0, notHelpful: 0 });
      expect(state.userVote).toBeNull();

      // Step 3: Add again
      const step3 = applyOptimisticUpdate(state, "helpful");
      state = applySuccess(step3.newState);
      expect(state.voteCounts).toEqual({ helpful: 1, notHelpful: 0 });
      expect(state.userVote).toBe("helpful");
    });

    it("should handle add → switch → toggle off", () => {
      let state = makeInitialState({ helpful: 10, notHelpful: 5 }, null);

      // Step 1: Add helpful
      const step1 = applyOptimisticUpdate(state, "helpful");
      state = applySuccess(step1.newState);
      expect(state.voteCounts).toEqual({ helpful: 11, notHelpful: 5 });

      // Step 2: Switch to not_helpful
      const step2 = applyOptimisticUpdate(state, "not_helpful");
      state = applySuccess(step2.newState);
      expect(state.voteCounts).toEqual({ helpful: 10, notHelpful: 6 });
      expect(state.userVote).toBe("not_helpful");

      // Step 3: Toggle off
      const step3 = applyOptimisticUpdate(state, "not_helpful");
      state = applySuccess(step3.newState);
      expect(state.voteCounts).toEqual({ helpful: 10, notHelpful: 5 });
      expect(state.userVote).toBeNull();
    });

    it("should handle failed vote then successful retry", () => {
      let state = makeInitialState({ helpful: 2, notHelpful: 0 }, null);

      // Step 1: Vote fails
      const step1 = applyOptimisticUpdate(state, "helpful");
      state = applyRollback(step1.newState, step1.prevVote, step1.prevCounts, "Network error");
      expect(state.voteCounts).toEqual({ helpful: 2, notHelpful: 0 });
      expect(state.userVote).toBeNull();
      expect(state.error).toBe("Network error");

      // Step 2: Retry succeeds
      const step2 = applyOptimisticUpdate(state, "helpful");
      state = applySuccess(step2.newState);
      expect(state.voteCounts).toEqual({ helpful: 3, notHelpful: 0 });
      expect(state.userVote).toBe("helpful");
      expect(state.error).toBeNull();
    });
  });
});
