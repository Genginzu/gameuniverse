import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { sortCommentsByDateDesc } from "../../../../src/app/api/comments/route";

/**
 * Feature: character-comments, Property 4: Tri par date décroissante
 *
 * _Pour toute_ liste de commentaires retournée par l'API pour un personnage,
 * les commentaires doivent être triés par date de création décroissante
 * (le plus récent en premier).
 *
 * **Validates: Requirements 3.1**
 */

// --- Generators ---

/** Generates a valid ISO date string from a timestamp within a reasonable range */
const isoDateGenerator = fc
  .integer({
    min: new Date("2020-01-01T00:00:00.000Z").getTime(),
    max: new Date("2030-12-31T23:59:59.999Z").getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

/** Generates a comment-like object with a createdAt ISO date string */
const commentGenerator = fc.record({
  id: fc.uuid(),
  createdAt: isoDateGenerator,
  content: fc.string({ minLength: 1, maxLength: 100 }),
});

/** Generates an array of comment-like objects (0 to 50 items) */
const commentArrayGenerator = fc.array(commentGenerator, { minLength: 0, maxLength: 50 });

// --- Tests ---

describe("sortCommentsByDateDesc - Property-Based Tests", () => {
  describe("Feature: character-comments, Property 4: Tri par date décroissante", () => {
    it("output is sorted in descending order by createdAt", () => {
      fc.assert(
        fc.property(commentArrayGenerator, (comments) => {
          const sorted = sortCommentsByDateDesc(comments);
          for (let i = 0; i < sorted.length - 1; i++) {
            const current = new Date(sorted[i].createdAt).getTime();
            const next = new Date(sorted[i + 1].createdAt).getTime();
            expect(current).toBeGreaterThanOrEqual(next);
          }
        }),
        { numRuns: 200 }
      );
    });

    it("output length equals input length", () => {
      fc.assert(
        fc.property(commentArrayGenerator, (comments) => {
          const sorted = sortCommentsByDateDesc(comments);
          expect(sorted.length).toBe(comments.length);
        }),
        { numRuns: 200 }
      );
    });

    it("output contains the same elements as input (no elements lost or added)", () => {
      fc.assert(
        fc.property(commentArrayGenerator, (comments) => {
          const sorted = sortCommentsByDateDesc(comments);
          const inputIds = comments.map((c) => c.id).sort();
          const outputIds = sorted.map((c) => c.id).sort();
          expect(outputIds).toEqual(inputIds);
        }),
        { numRuns: 200 }
      );
    });

    it("does not mutate the original array", () => {
      fc.assert(
        fc.property(commentArrayGenerator, (comments) => {
          const original = [...comments];
          sortCommentsByDateDesc(comments);
          expect(comments).toEqual(original);
        }),
        { numRuns: 200 }
      );
    });

    it("empty array remains empty", () => {
      const sorted = sortCommentsByDateDesc([]);
      expect(sorted).toEqual([]);
    });

    it("single-element array remains unchanged", () => {
      fc.assert(
        fc.property(commentGenerator, (comment) => {
          const sorted = sortCommentsByDateDesc([comment]);
          expect(sorted).toEqual([comment]);
        }),
        { numRuns: 100 }
      );
    });
  });
});
