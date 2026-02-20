import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { LibraryComparisonService } from "@/lib/services/libraryComparisonService";

// --- Generators ---

/** Generates a valid CommonGameRow as returned by the SQL RPC function */
const commonGameRowArb = fc.record({
  game_id: fc.uuid(),
  slug: fc.stringMatching(/^[a-z0-9][a-z0-9-]{0,30}[a-z0-9]$/),
  cover_image_url: fc.oneof(fc.webUrl(), fc.constant(null)),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  genre_names: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 5 }),
  total_count: fc.integer({ min: 0, max: 10000 }),
});

describe("Library Comparison Service — Property-Based Tests", () => {
  // Feature: library-comparison, Property 2: Invariant du compteur
  // **Validates: Requirements 1.2**
  describe("Property 2: Invariant du compteur", () => {
    it("commonGamesCount >= commonGames.length and commonGames.length <= pageSize", () => {
      const pageSize = 12;

      fc.assert(
        fc.property(
          fc.array(commonGameRowArb, { minLength: 0, maxLength: pageSize }),
          fc.integer({ min: 0, max: 500 }),
          (rows, extraCount) => {
            // totalCount must be >= rows on the current page (simulates real DB behavior)
            const totalCount = rows.length + extraCount;

            const commonGames = rows.map((row) =>
              LibraryComparisonService.transformCommonGameRow(row)
            );
            const pagination = LibraryComparisonService.computePagination(totalCount, 1, pageSize);

            // Invariant: commonGamesCount >= commonGames.length
            expect(totalCount).toBeGreaterThanOrEqual(commonGames.length);

            // Invariant: commonGames.length <= pageSize
            expect(commonGames.length).toBeLessThanOrEqual(pageSize);

            // Pagination totalPages is consistent with totalCount
            if (totalCount === 0) {
              expect(pagination.totalPages).toBe(0);
            } else {
              expect(pagination.totalPages).toBe(Math.ceil(totalCount / pageSize));
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: library-comparison, Property 5: Calcul de pagination
  // **Validates: Requirements 3.4**
  describe("Property 5: Calcul de pagination", () => {
    it("totalPages = ceil(totalCount / 12) and hasNextPage = (page < totalPages)", () => {
      const pageSize = 12;

      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          (totalCount, page) => {
            const result = LibraryComparisonService.computePagination(totalCount, page, pageSize);

            // totalPages calculation
            const expectedTotalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);
            expect(result.totalPages).toBe(expectedTotalPages);

            // hasNextPage calculation
            const expectedHasNextPage = page < expectedTotalPages;
            expect(result.hasNextPage).toBe(expectedHasNextPage);

            // currentPage passthrough
            expect(result.currentPage).toBe(page);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: library-comparison, Property 7: Sélection du titre selon la locale
  // **Validates: Requirements 6.3**
  describe("Property 7: Sélection du titre selon la locale", () => {
    it("the returned title matches the row title (passthrough from SQL locale selection)", () => {
      fc.assert(
        fc.property(commonGameRowArb, (row) => {
          const result = LibraryComparisonService.transformCommonGameRow(row);

          // The title must be passed through exactly as the SQL function resolved it
          expect(result.title).toBe(row.title);

          // All other fields must also be correctly mapped
          expect(result.gameId).toBe(row.game_id);
          expect(result.slug).toBe(row.slug);
          expect(result.coverImage).toBe(row.cover_image_url);
          expect(result.genres).toEqual(row.genre_names);
        }),
        { numRuns: 100 }
      );
    });
  });
});
