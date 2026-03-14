import { describe, it, expect, vi, afterEach } from "vitest";
import fc from "fast-check";
import {
  sortCollections,
  computeCollectionsPagination,
  computeCollectionsStats,
  filterCollectionsByVisibility,
  buildCollectionsUrl,
  PlayerCollectionsService,
} from "@/lib/services/playerCollectionsService";
import type { CollectionSummary } from "@/types/collection";
import type { CollectionSortOption } from "@/types/playerCollection";

// ---------------------------------------------------------------------------
// Shared arbitraries
// ---------------------------------------------------------------------------

const sortOptionArb = fc.constantFrom<CollectionSortOption>(
  "updated_at_desc",
  "name_asc",
  "name_desc",
  "games_count_desc"
);

const collectionSummaryArb: fc.Arbitrary<CollectionSummary> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  slug: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  isPublic: fc.boolean(),
  gamesCount: fc.integer({ min: 0, max: 500 }),
  updatedAt: fc
    .integer({
      min: new Date("2020-01-01").getTime(),
      max: new Date("2025-12-31").getTime(),
    })
    .map((ts) => new Date(ts).toISOString()),
  coverImages: fc.array(fc.webUrl(), { maxLength: 4 }),
  coverImageUrl: fc.option(fc.webUrl(), { nil: null }),
});

// ---------------------------------------------------------------------------
// Property 1: Correction du tri
// Feature: player-collections-tab, Property 1: Correction du tri
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 1.1, 1.5, 1.6**
 */
describe("Property 1: Correction du tri", () => {
  it("returns a correctly ordered list for any collections and sort option", () => {
    fc.assert(
      fc.property(
        fc.array(collectionSummaryArb, { maxLength: 30 }),
        sortOptionArb,
        (collections, sort) => {
          const sorted = sortCollections(collections, sort);
          expect(sorted).toHaveLength(collections.length);

          for (let i = 0; i < sorted.length - 1; i++) {
            const a = sorted[i];
            const b = sorted[i + 1];

            switch (sort) {
              case "updated_at_desc":
                expect(new Date(a.updatedAt).getTime()).toBeGreaterThanOrEqual(
                  new Date(b.updatedAt).getTime()
                );
                break;
              case "name_asc":
                expect(a.name.localeCompare(b.name)).toBeLessThanOrEqual(0);
                break;
              case "name_desc":
                expect(b.name.localeCompare(a.name)).toBeLessThanOrEqual(0);
                break;
              case "games_count_desc":
                expect(a.gamesCount).toBeGreaterThanOrEqual(b.gamesCount);
                break;
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Correction de la pagination
// Feature: player-collections-tab, Property 2: Correction de la pagination
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 1.2, 1.4**
 */
describe("Property 2: Correction de la pagination", () => {
  it("computes totalPages and hasNextPage correctly for any count and page", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 1, max: 100 }),
        (totalCount, page) => {
          const pageSize = 12;
          const result = computeCollectionsPagination(totalCount, page, pageSize);

          const expectedTotalPages = Math.max(1, Math.ceil(totalCount / pageSize));
          expect(result.totalPages).toBe(expectedTotalPages);
          expect(result.currentPage).toBe(page);
          expect(result.totalCollections).toBe(totalCount);
          expect(result.hasNextPage).toBe(page < expectedTotalPages);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3: Correction des statistiques agrégées
// Feature: player-collections-tab, Property 3: Correction des statistiques agrégées
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirement 1.7**
 */
describe("Property 3: Correction des statistiques agrégées", () => {
  it("computes totalCollections, totalGames and largestCollection correctly", () => {
    fc.assert(
      fc.property(fc.array(collectionSummaryArb, { maxLength: 50 }), (collections) => {
        const stats = computeCollectionsStats(collections);

        expect(stats.totalCollections).toBe(collections.length);

        const expectedTotalGames = collections.reduce((sum, c) => sum + c.gamesCount, 0);
        expect(stats.totalGames).toBe(expectedTotalGames);

        if (collections.length === 0) {
          expect(stats.largestCollection).toBeNull();
        } else {
          const maxCount = Math.max(...collections.map((c) => c.gamesCount));
          const expectedName = collections.find((c) => c.gamesCount === maxCount)!.name;
          expect(stats.largestCollection).toBe(expectedName);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Correction du filtrage par visibilité
// Feature: player-collections-tab, Property 4: Correction du filtrage par visibilité
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 1.8, 1.9**
 */
describe("Property 4: Correction du filtrage par visibilité", () => {
  it("returns all collections for owner, only public for non-owner", () => {
    fc.assert(
      fc.property(
        fc.array(collectionSummaryArb, { maxLength: 30 }),
        fc.boolean(),
        (collections, isOwner) => {
          const filtered = filterCollectionsByVisibility(collections, isOwner);

          if (isOwner) {
            expect(filtered).toHaveLength(collections.length);
            expect(filtered).toEqual(collections);
          } else {
            const publicOnly = collections.filter((c) => c.isPublic === true);
            expect(filtered).toHaveLength(publicOnly.length);
            for (const c of filtered) {
              expect(c.isPublic).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Construction correcte de l'URL du service
// Feature: player-collections-tab, Property 5: Construction correcte de l'URL du service
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirement 6.1**
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
          const url = buildCollectionsUrl(playerId, params);

          // Must start with correct path
          expect(url).toContain(`/api/players/${playerId}/collections`);

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
// Feature: player-collections-tab, Property 6: Propagation des erreurs du service
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirement 6.3**
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
            await PlayerCollectionsService.fetchCollections("some-player-id");
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
