/**
 * Property-Based Tests for adminReviewQuerySchema
 *
 * Feature: admin-review-management, Property 1: Pagination correcte
 *
 * _Pour toute_ combinaison valide de page et limit, le schéma accepte les
 * paramètres et les valeurs parsées respectent les contraintes de pagination.
 *
 * **Validates: Requirements 1.1**
 */

import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import { adminReviewQuerySchema } from "../../../../src/lib/validations/admin-review-query";

// --- Generators ---

const validPageGenerator = fc.integer({ min: 1, max: 10000 });
const validLimitGenerator = fc.integer({ min: 1, max: 100 });
const invalidPageGenerator = fc.oneof(
  fc.integer({ min: -1000, max: 0 }),
  fc.double({ min: 1.01, max: 99.99, noNaN: true }).filter((n) => !Number.isInteger(n))
);
const invalidLimitGenerator = fc.oneof(
  fc.integer({ min: -1000, max: 0 }),
  fc.integer({ min: 101, max: 10000 })
);
const validSortByGenerator = fc.constantFrom(
  "created_at",
  "updated_at",
  "rating",
  "player_name",
  "game_title"
);
const validSortOrderGenerator = fc.constantFrom("asc", "desc");

describe("Admin Review Query Schema - Property-Based Tests", () => {
  // Feature: admin-review-management, Property 1: Pagination correcte

  describe("Property 1: Pagination correcte", () => {
    it("accepts any valid page (≥1 integer) and limit (1-100 integer)", () => {
      fc.assert(
        fc.property(validPageGenerator, validLimitGenerator, (page, limit) => {
          const result = adminReviewQuerySchema.safeParse({ page, limit });
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.page).toBe(page);
            expect(result.data.limit).toBe(limit);
          }
        }),
        { numRuns: 200 }
      );
    });

    it("rejects any invalid page (≤0 or non-integer)", () => {
      fc.assert(
        fc.property(invalidPageGenerator, (page) => {
          const result = adminReviewQuerySchema.safeParse({ page });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects any invalid limit (≤0 or >100)", () => {
      fc.assert(
        fc.property(invalidLimitGenerator, (limit) => {
          const result = adminReviewQuerySchema.safeParse({ limit });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("coerces string page and limit to numbers correctly", () => {
      fc.assert(
        fc.property(validPageGenerator, validLimitGenerator, (page, limit) => {
          const result = adminReviewQuerySchema.safeParse({
            page: String(page),
            limit: String(limit),
          });
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.page).toBe(page);
            expect(result.data.limit).toBe(limit);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("accepts any valid combination of all parameters", () => {
      fc.assert(
        fc.property(
          validPageGenerator,
          validLimitGenerator,
          fc.string({ minLength: 0, maxLength: 50 }),
          validSortByGenerator,
          validSortOrderGenerator,
          (page, limit, search, sortBy, sortOrder) => {
            const result = adminReviewQuerySchema.safeParse({
              page,
              limit,
              search,
              sort_by: sortBy,
              sort_order: sortOrder,
            });
            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data.page).toBe(page);
              expect(result.data.limit).toBe(limit);
              expect(result.data.sort_by).toBe(sortBy);
              expect(result.data.sort_order).toBe(sortOrder);
            }
          }
        ),
        { numRuns: 200 }
      );
    });
  });
});
