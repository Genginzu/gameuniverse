import { describe, it, expect, vi, afterEach } from "vitest";
import fc from "fast-check";
import {
  sortReviews,
  transformReviewRecord,
  computeReviewsPagination,
  computeRatingDistribution,
  buildReviewsUrl,
  type RawReviewRecord,
} from "@/lib/utils/playerReviewUtils";
import type { PlayerReviewItem, ReviewSortOption } from "@/types/playerReview";
import { PlayerReviewsService } from "@/lib/services/playerReviewsService";

// ---------------------------------------------------------------------------
// Shared arbitraries
// ---------------------------------------------------------------------------

const sortOptionArb = fc.constantFrom<ReviewSortOption>(
  "date_desc",
  "date_asc",
  "rating_desc",
  "rating_asc"
);

const reviewItemArb: fc.Arbitrary<PlayerReviewItem> = fc.record({
  id: fc.uuid(),
  gameId: fc.uuid(),
  gameSlug: fc.string({ minLength: 1, maxLength: 50 }),
  gameName: fc.string({ minLength: 1, maxLength: 100 }),
  gameCoverUrl: fc.option(fc.webUrl(), { nil: null }),
  rating: fc.integer({ min: 0, max: 20 }),
  content: fc.string(),
  positivePoints: fc.array(fc.string(), { maxLength: 5 }),
  negativePoints: fc.array(fc.string(), { maxLength: 5 }),
  createdAt: fc
    .date({ min: new Date("2020-01-01"), max: new Date("2025-12-31") })
    .map((d) => d.toISOString()),
  updatedAt: fc
    .date({ min: new Date("2020-01-01"), max: new Date("2025-12-31") })
    .map((d) => d.toISOString()),
});

const rawRecordArb: fc.Arbitrary<RawReviewRecord> = fc.record({
  id: fc.uuid(),
  game_id: fc.uuid(),
  game_slug: fc.string({ minLength: 1, maxLength: 50 }),
  game_name: fc.string({ minLength: 1, maxLength: 100 }),
  game_cover_url: fc.option(fc.webUrl(), { nil: null }),
  rating: fc.integer({ min: 0, max: 20 }),
  content: fc.string(),
  positive_points: fc.array(fc.string(), { maxLength: 5 }),
  negative_points: fc.array(fc.string(), { maxLength: 5 }),
  created_at: fc
    .date({ min: new Date("2020-01-01"), max: new Date("2025-12-31") })
    .map((d) => d.toISOString()),
  updated_at: fc
    .date({ min: new Date("2020-01-01"), max: new Date("2025-12-31") })
    .map((d) => d.toISOString()),
});

// ---------------------------------------------------------------------------
// Property 1: Correction du tri
// Feature: player-reviews-tab, Property 1: Correction du tri
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 1.1, 1.7, 4.2**
 */
describe("Property 1: Correction du tri", () => {
  it("returns a correctly ordered list for any reviews and sort option", () => {
    fc.assert(
      fc.property(fc.array(reviewItemArb, { maxLength: 30 }), sortOptionArb, (reviews, sort) => {
        const sorted = sortReviews(reviews, sort);
        expect(sorted).toHaveLength(reviews.length);

        for (let i = 0; i < sorted.length - 1; i++) {
          const a = sorted[i];
          const b = sorted[i + 1];

          switch (sort) {
            case "date_desc":
              expect(new Date(a.createdAt).getTime()).toBeGreaterThanOrEqual(
                new Date(b.createdAt).getTime()
              );
              break;
            case "date_asc":
              expect(new Date(a.createdAt).getTime()).toBeLessThanOrEqual(
                new Date(b.createdAt).getTime()
              );
              break;
            case "rating_desc":
              expect(a.rating).toBeGreaterThanOrEqual(b.rating);
              break;
            case "rating_asc":
              expect(a.rating).toBeLessThanOrEqual(b.rating);
              break;
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Complétude des données après transformation
// Feature: player-reviews-tab, Property 2: Complétude des données après transformation
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirement 1.2**
 */
describe("Property 2: Complétude des données après transformation", () => {
  it("maps all required fields from raw record to PlayerReviewItem", () => {
    fc.assert(
      fc.property(rawRecordArb, (raw) => {
        const item = transformReviewRecord(raw);

        expect(item.id).toBe(raw.id);
        expect(item.gameId).toBe(raw.game_id);
        expect(item.gameSlug).toBe(raw.game_slug);
        expect(item.gameName).toBe(raw.game_name);
        expect(item.gameCoverUrl).toBe(raw.game_cover_url);
        expect(item.rating).toBe(raw.rating);
        expect(item.content).toBe(raw.content);
        expect(item.positivePoints).toEqual(raw.positive_points);
        expect(item.negativePoints).toEqual(raw.negative_points);
        expect(item.createdAt).toBe(raw.created_at);
        expect(item.updatedAt).toBe(raw.updated_at);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3: Correction de la pagination
// Feature: player-reviews-tab, Property 3: Correction de la pagination
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 1.3, 1.5**
 */
describe("Property 3: Correction de la pagination", () => {
  it("computes totalPages and hasNextPage correctly for any count and page", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 1, max: 100 }),
        (totalCount, page) => {
          const pageSize = 10;
          const { totalPages, hasNextPage } = computeReviewsPagination(totalCount, page, pageSize);

          const expectedTotalPages = totalCount <= 0 ? 0 : Math.ceil(totalCount / pageSize);
          expect(totalPages).toBe(expectedTotalPages);
          expect(hasNextPage).toBe(page < expectedTotalPages);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Correction des statistiques agrégées
// Feature: player-reviews-tab, Property 4: Correction des statistiques agrégées
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 1.4, 3.3**
 */
describe("Property 4: Correction des statistiques agrégées", () => {
  it("produces distribution whose counts sum to total and each rating falls in correct range", () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 20 }), { maxLength: 100 }), (ratings) => {
        const dist = computeRatingDistribution(ratings);

        // Sum of counts equals total
        const totalFromDist = dist.reduce((sum, d) => sum + d.count, 0);
        expect(totalFromDist).toBe(ratings.length);

        // Verify each range has the correct count
        const ranges = [
          { range: "0-5", min: 0, max: 5 },
          { range: "6-10", min: 6, max: 10 },
          { range: "11-15", min: 11, max: 15 },
          { range: "16-20", min: 16, max: 20 },
        ];

        for (const { range, min, max } of ranges) {
          const expected = ratings.filter((r) => r >= min && r <= max).length;
          const bucket = dist.find((d) => d.range === range);
          expect(bucket).toBeDefined();
          expect(bucket!.count).toBe(expected);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Construction correcte de l'URL du service
// Feature: player-reviews-tab, Property 5: Construction correcte de l'URL du service
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirement 5.1**
 */
describe("Property 5: Construction correcte de l'URL du service", () => {
  it("builds URL with correct path and only non-undefined query params", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.record({
          page: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
          sort: fc.option(sortOptionArb, { nil: undefined }),
          locale: fc.option(fc.constantFrom("fr", "en"), { nil: undefined }),
        }),
        (playerId, params) => {
          const url = buildReviewsUrl(playerId, params);

          // Must start with correct path
          expect(url).toContain(`/api/players/${playerId}/reviews`);

          // Check defined params are present, undefined ones are absent
          if (params.page !== undefined) {
            expect(url).toContain(`page=${params.page}`);
          } else {
            expect(url).not.toContain("page=");
          }

          if (params.sort !== undefined) {
            expect(url).toContain(`sort=${params.sort}`);
          } else {
            expect(url).not.toContain("sort=");
          }

          if (params.locale !== undefined) {
            expect(url).toContain(`locale=${params.locale}`);
          } else {
            expect(url).not.toContain("locale=");
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: Propagation des erreurs du service
// Feature: player-reviews-tab, Property 6: Propagation des erreurs du service
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirement 5.2**
 */
describe("Property 6: Propagation des erreurs du service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws with descriptive message for any HTTP error status", () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 400, max: 599 }),
        fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
        async (status, errorMsg) => {
          const body = errorMsg ? { error: errorMsg } : null;

          vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
              ok: false,
              status,
              json: () => Promise.resolve(body),
            })
          );

          try {
            await PlayerReviewsService.fetchReviews("some-player-id");
            // Should not reach here
            expect.unreachable("Expected an error to be thrown");
          } catch (err) {
            expect(err).toBeInstanceOf(Error);
            const message = (err as Error).message;
            if (errorMsg) {
              expect(message).toBe(errorMsg);
            } else {
              expect(message).toContain(String(status));
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
