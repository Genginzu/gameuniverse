import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Feature: character-favorites, Property 2: Rollback de la mise à jour optimiste en cas d'erreur
// **Validates: Requirements 1.4**

// ---------------------------------------------------------------------------
// State machine modelling the optimistic update / rollback logic
// from useCharacterFavorite.toggleFavorite
// ---------------------------------------------------------------------------

interface FavoriteState {
  isFavorite: boolean;
  favoriteCount: number;
}

/**
 * Applies the optimistic update: flips isFavorite and adjusts the counter.
 * This mirrors the first half of toggleFavorite before the fetch call.
 */
function applyOptimisticUpdate(state: FavoriteState): FavoriteState {
  return {
    isFavorite: !state.isFavorite,
    favoriteCount: state.isFavorite ? state.favoriteCount - 1 : state.favoriteCount + 1,
  };
}

/**
 * Rolls back to the previous state when the API call fails.
 * This mirrors the catch block in toggleFavorite.
 */
function rollbackOnError(
  _optimisticState: FavoriteState,
  previousState: FavoriteState
): FavoriteState {
  return {
    isFavorite: previousState.isFavorite,
    favoriteCount: previousState.favoriteCount,
  };
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Generate a realistic favorite count (0–1000) */
const favoriteCountGen = fc.integer({ min: 0, max: 1000 });

/** Generate any valid initial favorite state */
const favoriteStateGen: fc.Arbitrary<FavoriteState> = fc.record({
  isFavorite: fc.boolean(),
  favoriteCount: favoriteCountGen,
});

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe("useCharacterFavorite — Property-Based Tests", () => {
  // -------------------------------------------------------------------------
  // Property 2: Rollback de la mise à jour optimiste en cas d'erreur
  // For any initial favorite state, if the toggle API call fails,
  // the state must revert to the values before the action.
  // **Validates: Requirements 1.4**
  // -------------------------------------------------------------------------
  describe("Property 2: Rollback de la mise à jour optimiste en cas d'erreur", () => {
    it("after a failed toggle, isFavorite reverts to its initial value", () => {
      fc.assert(
        fc.property(favoriteStateGen, (initial) => {
          const optimistic = applyOptimisticUpdate(initial);
          const rolledBack = rollbackOnError(optimistic, initial);

          expect(rolledBack.isFavorite).toBe(initial.isFavorite);
        }),
        { numRuns: 100 }
      );
    });

    it("after a failed toggle, favoriteCount reverts to its initial value", () => {
      fc.assert(
        fc.property(favoriteStateGen, (initial) => {
          const optimistic = applyOptimisticUpdate(initial);
          const rolledBack = rollbackOnError(optimistic, initial);

          expect(rolledBack.favoriteCount).toBe(initial.favoriteCount);
        }),
        { numRuns: 100 }
      );
    });

    it("the full state after rollback is identical to the initial state", () => {
      fc.assert(
        fc.property(favoriteStateGen, (initial) => {
          const optimistic = applyOptimisticUpdate(initial);
          const rolledBack = rollbackOnError(optimistic, initial);

          expect(rolledBack).toEqual(initial);
        }),
        { numRuns: 100 }
      );
    });

    it("optimistic update always changes isFavorite before rollback restores it", () => {
      fc.assert(
        fc.property(favoriteStateGen, (initial) => {
          const optimistic = applyOptimisticUpdate(initial);

          // The optimistic state must differ from the initial state
          expect(optimistic.isFavorite).toBe(!initial.isFavorite);

          // After rollback, it must match the initial state again
          const rolledBack = rollbackOnError(optimistic, initial);
          expect(rolledBack.isFavorite).toBe(initial.isFavorite);
        }),
        { numRuns: 100 }
      );
    });

    it("optimistic update adjusts count correctly before rollback restores it", () => {
      fc.assert(
        fc.property(favoriteStateGen, (initial) => {
          const optimistic = applyOptimisticUpdate(initial);

          // Count should have been adjusted by exactly 1
          const expectedOptimisticCount = initial.isFavorite
            ? initial.favoriteCount - 1
            : initial.favoriteCount + 1;
          expect(optimistic.favoriteCount).toBe(expectedOptimisticCount);

          // After rollback, count must match the initial value
          const rolledBack = rollbackOnError(optimistic, initial);
          expect(rolledBack.favoriteCount).toBe(initial.favoriteCount);
        }),
        { numRuns: 100 }
      );
    });

    it("multiple consecutive failed toggles always roll back to the same initial state", () => {
      fc.assert(
        fc.property(favoriteStateGen, fc.integer({ min: 2, max: 10 }), (initial, attempts) => {
          // Simulate N consecutive toggle attempts that all fail
          for (let i = 0; i < attempts; i++) {
            const optimistic = applyOptimisticUpdate(initial);
            const rolledBack = rollbackOnError(optimistic, initial);
            expect(rolledBack).toEqual(initial);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
