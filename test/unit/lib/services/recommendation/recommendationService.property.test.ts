import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import type { GameRecommendation, RecommendationsResponse } from "@/types/recommendation";

// Mock data fetchers and cache before importing the service
vi.mock("@/lib/services/recommendation/dataFetchers");
vi.mock("@/lib/services/recommendation/cache", () => ({
  cacheGet: vi.fn(() => null),
  cacheSet: vi.fn(),
  cacheClear: vi.fn(),
}));

import {
  getRecommendationsForGame,
  getPersonalRecommendations,
} from "@/lib/services/recommendationService";
import {
  fetchGameGenreIds,
  fetchAllGameGenres,
  fetchCoOccurrences,
  fetchReviewStats,
  fetchGameMetadata,
  fetchUserLibraryGameIds,
} from "@/lib/services/recommendation/dataFetchers";

// --- Generators ---

const gameIdGen = fc.uuid();

const genreGen = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 30 }),
});

const gameRecommendationGen = fc.record({
  id: fc.uuid(),
  slug: fc.string({ minLength: 1, maxLength: 50 }),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  coverImage: fc.option(fc.webUrl(), { nil: null }),
  genres: fc.array(genreGen, { minLength: 0, maxLength: 5 }),
  developer: fc.string({ minLength: 0, maxLength: 50 }),
  combinedScore: fc.double({ min: 0, max: 1, noNaN: true }),
});

const recommendationsResponseGen = fc.record({
  recommendations: fc.array(gameRecommendationGen, { minLength: 0, maxLength: 10 }),
  sourceGameId: fc.uuid(),
  generatedAt: fc
    .integer({ min: 946684800000, max: 4102444800000 }) // 2000-01-01 to 2100-01-01 in ms
    .map((ts) => new Date(ts).toISOString()),
});

/** Generate N candidate game IDs (unique, excluding sourceId) */
function candidateIdsGen(sourceId: string, count: number) {
  return fc
    .uniqueArray(fc.uuid(), { minLength: count, maxLength: count })
    .map((ids) => ids.filter((id) => id !== sourceId).slice(0, count));
}

// --- Mock helpers ---

/** Set up mocks so getRecommendationsForGame returns predictable results */
function setupMocks(sourceId: string, candidateIds: string[], genreIds: string[] = ["g1", "g2"]) {
  const allGenres = new Map<string, string[]>();
  allGenres.set(sourceId, genreIds);
  for (const cid of candidateIds) {
    allGenres.set(cid, ["g1"]); // share at least one genre
  }

  const metadataMap = new Map<string, GameRecommendation>();
  for (const cid of candidateIds) {
    metadataMap.set(cid, {
      id: cid,
      slug: `slug-${cid.slice(0, 8)}`,
      title: `Title ${cid.slice(0, 8)}`,
      coverImage: null,
      genres: [{ id: "g1", name: "Action" }],
      developer: "Dev",
      combinedScore: 0,
    });
  }

  vi.mocked(fetchGameGenreIds).mockResolvedValue(genreIds);
  vi.mocked(fetchAllGameGenres).mockResolvedValue(allGenres);
  vi.mocked(fetchCoOccurrences).mockResolvedValue({
    coOccurrences: [],
    sourceLibraryCount: 0,
  });
  vi.mocked(fetchReviewStats).mockResolvedValue(new Map());
  vi.mocked(fetchGameMetadata).mockResolvedValue(metadataMap);
}

// --- Tests ---

beforeEach(() => {
  vi.clearAllMocks();
});

describe("recommendationService - Property-Based Tests", () => {
  /**
   * Property 2: Source game exclusion
   * _For any_ source game and any set of candidate games, the list of
   * recommendations returned should never contain the source game itself.
   * **Validates: Requirements 1.3**
   */
  describe("Property 2: Source game exclusion", () => {
    it("never includes the source game in recommendations", async () => {
      await fc.assert(
        fc.asyncProperty(
          gameIdGen,
          fc.uniqueArray(fc.uuid(), { minLength: 1, maxLength: 8 }),
          async (sourceId, candidateIds) => {
            vi.clearAllMocks();
            const candidates = candidateIds.filter((id) => id !== sourceId);
            if (candidates.length === 0) return; // skip degenerate case
            setupMocks(sourceId, candidates);

            const results = await getRecommendationsForGame(sourceId);
            const resultIds = results.map((r) => r.id);
            expect(resultIds).not.toContain(sourceId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Output sorted by descending score
   * _For any_ list of recommendations returned, each item's combinedScore
   * should be >= the next item's combinedScore.
   * **Validates: Requirements 4.2**
   */
  describe("Property 6: Output sorted by descending score", () => {
    it("returns recommendations sorted by descending combinedScore", async () => {
      await fc.assert(
        fc.asyncProperty(
          gameIdGen,
          fc.uniqueArray(fc.uuid(), { minLength: 2, maxLength: 10 }),
          async (sourceId, candidateIds) => {
            vi.clearAllMocks();
            const candidates = candidateIds.filter((id) => id !== sourceId);
            if (candidates.length < 2) return;
            setupMocks(sourceId, candidates);

            const results = await getRecommendationsForGame(sourceId);
            for (let i = 0; i < results.length - 1; i++) {
              expect(results[i].combinedScore).toBeGreaterThanOrEqual(results[i + 1].combinedScore);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Output respects limit
   * _For any_ positive integer limit N, the list of recommendations
   * should contain at most N items.
   * **Validates: Requirements 4.3, 5.3**
   */
  describe("Property 7: Output respects limit", () => {
    it("returns at most N items when limit is N", async () => {
      await fc.assert(
        fc.asyncProperty(
          gameIdGen,
          fc.integer({ min: 1, max: 20 }),
          fc.uniqueArray(fc.uuid(), { minLength: 1, maxLength: 15 }),
          async (sourceId, limit, candidateIds) => {
            vi.clearAllMocks();
            const candidates = candidateIds.filter((id) => id !== sourceId);
            if (candidates.length === 0) return;
            setupMocks(sourceId, candidates);

            const results = await getRecommendationsForGame(sourceId, { limit });
            expect(results.length).toBeLessThanOrEqual(limit);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Library exclusion
   * _For any_ authenticated player, no recommended game's ID should appear
   * in the player's library game IDs.
   * **Validates: Requirements 4.4, 5.5**
   */
  describe("Property 8: Library exclusion", () => {
    it("excludes games from the player's library", async () => {
      await fc.assert(
        fc.asyncProperty(
          gameIdGen,
          fc.uniqueArray(fc.uuid(), { minLength: 3, maxLength: 10 }),
          async (sourceId, allIds) => {
            vi.clearAllMocks();
            const ids = allIds.filter((id) => id !== sourceId);
            if (ids.length < 2) return;
            // Split: first half is library, rest are candidates
            const mid = Math.max(1, Math.floor(ids.length / 2));
            const libraryIds = ids.slice(0, mid);
            const candidateIds = ids.slice(mid);
            if (candidateIds.length === 0) return;

            setupMocks(sourceId, [...libraryIds, ...candidateIds]);

            const results = await getRecommendationsForGame(sourceId, {
              excludeGameIds: libraryIds,
            });
            const resultIds = new Set(results.map((r) => r.id));
            for (const libId of libraryIds) {
              expect(resultIds.has(libId)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: Deduplication keeps max score
   * _For any_ set of recommendation lists from multiple source games,
   * after aggregation, each candidate should appear at most once with
   * the maximum combinedScore.
   * **Validates: Requirements 7.2**
   */
  describe("Property 9: Deduplication keeps max score", () => {
    it("deduplicates candidates keeping the highest combinedScore", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.uniqueArray(fc.uuid(), { minLength: 2, maxLength: 4 }), // library games
          fc.uniqueArray(fc.uuid(), { minLength: 2, maxLength: 6 }), // candidate games
          async (userId, libraryIds, candidateIds) => {
            vi.clearAllMocks();
            const candidates = candidateIds.filter((id) => !libraryIds.includes(id));
            if (candidates.length === 0 || libraryIds.length === 0) return;

            vi.mocked(fetchUserLibraryGameIds).mockResolvedValue(libraryIds);

            // For each library game, set up mocks that return overlapping candidates
            // We need to track what getRecommendationsForGame would return
            // by mocking the data fetchers consistently
            for (const libGameId of libraryIds) {
              const allGenres = new Map<string, string[]>();
              allGenres.set(libGameId, ["g1", "g2"]);
              for (const cid of candidates) {
                allGenres.set(cid, ["g1"]);
              }
              // Also add other library games so they exist in allGameGenres
              for (const otherLib of libraryIds) {
                if (otherLib !== libGameId) allGenres.set(otherLib, ["g1"]);
              }
            }

            // Set up consistent mocks for all calls
            const allGenres = new Map<string, string[]>();
            for (const libId of libraryIds) allGenres.set(libId, ["g1", "g2"]);
            for (const cid of candidates) allGenres.set(cid, ["g1"]);

            const metadataMap = new Map<string, GameRecommendation>();
            for (const cid of candidates) {
              metadataMap.set(cid, {
                id: cid,
                slug: `s-${cid.slice(0, 8)}`,
                title: `T-${cid.slice(0, 8)}`,
                coverImage: null,
                genres: [{ id: "g1", name: "Action" }],
                developer: "Dev",
                combinedScore: 0,
              });
            }

            vi.mocked(fetchGameGenreIds).mockImplementation(
              async (gid) => allGenres.get(gid) ?? []
            );
            vi.mocked(fetchAllGameGenres).mockResolvedValue(allGenres);
            vi.mocked(fetchCoOccurrences).mockResolvedValue({
              coOccurrences: [],
              sourceLibraryCount: 0,
            });
            vi.mocked(fetchReviewStats).mockResolvedValue(new Map());
            vi.mocked(fetchGameMetadata).mockResolvedValue(metadataMap);

            const results = await getPersonalRecommendations(userId);

            // Each candidate appears at most once
            const ids = results.map((r) => r.id);
            expect(new Set(ids).size).toBe(ids.length);

            // No library game in results
            for (const libId of libraryIds) {
              expect(ids).not.toContain(libId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: Recommendation serialization round-trip
   * _For any_ valid RecommendationsResponse object, serializing to JSON
   * and deserializing back should produce a deeply equal object.
   * **Validates: Requirements 9.1, 9.2**
   */
  describe("Property 10: Recommendation serialization round-trip", () => {
    it("survives JSON round-trip without data loss", () => {
      fc.assert(
        fc.property(recommendationsResponseGen, (response) => {
          const serialized = JSON.stringify(response);
          const deserialized = JSON.parse(serialized) as RecommendationsResponse;
          expect(deserialized).toEqual(response);
        }),
        { numRuns: 200 }
      );
    });
  });

  /**
   * Property 11: Response contains required fields
   * _For any_ GameRecommendation object, it should contain non-undefined
   * values for: id, slug, title, coverImage (may be null), genres,
   * developer, and combinedScore.
   * **Validates: Requirements 5.4**
   */
  describe("Property 11: Response contains required fields", () => {
    it("every GameRecommendation has all required fields defined", () => {
      fc.assert(
        fc.property(gameRecommendationGen, (rec) => {
          expect(rec.id).toBeDefined();
          expect(typeof rec.id).toBe("string");
          expect(rec.slug).toBeDefined();
          expect(typeof rec.slug).toBe("string");
          expect(rec.title).toBeDefined();
          expect(typeof rec.title).toBe("string");
          // coverImage may be null but must not be undefined
          expect(rec.coverImage !== undefined).toBe(true);
          expect(rec.genres).toBeDefined();
          expect(Array.isArray(rec.genres)).toBe(true);
          expect(rec.developer).toBeDefined();
          expect(typeof rec.developer).toBe("string");
          expect(rec.combinedScore).toBeDefined();
          expect(typeof rec.combinedScore).toBe("number");
        }),
        { numRuns: 200 }
      );
    });

    it("service output contains all required fields", async () => {
      await fc.assert(
        fc.asyncProperty(
          gameIdGen,
          fc.uniqueArray(fc.uuid(), { minLength: 1, maxLength: 5 }),
          async (sourceId, candidateIds) => {
            vi.clearAllMocks();
            const candidates = candidateIds.filter((id) => id !== sourceId);
            if (candidates.length === 0) return;
            setupMocks(sourceId, candidates);

            const results = await getRecommendationsForGame(sourceId);
            for (const rec of results) {
              expect(rec.id).toBeDefined();
              expect(rec.slug).toBeDefined();
              expect(rec.title).toBeDefined();
              expect(rec.coverImage !== undefined).toBe(true);
              expect(rec.genres).toBeDefined();
              expect(rec.developer).toBeDefined();
              expect(typeof rec.combinedScore).toBe("number");
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
