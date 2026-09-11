import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GameRecommendation } from "@/types/recommendation";

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
  fetchMetascores,
  fetchGameMetadata,
  fetchUserLibraryGameIds,
} from "@/lib/services/recommendation/dataFetchers";
import { cacheGet, cacheSet } from "@/lib/services/recommendation/cache";

// --- Constants & Helpers ---

const SOURCE_ID = "source-game-id";
const CANDIDATE_A = "candidate-a";
const CANDIDATE_B = "candidate-b";
const USER_ID = "user-123";

function makeMetadata(id: string): GameRecommendation {
  return {
    id,
    slug: `slug-${id}`,
    title: `Title ${id}`,
    coverImage: null,
    genres: [{ id: "g1", name: "Action" }],
    developer: "Dev",
    combinedScore: 0,
  };
}

/** Set up data fetcher mocks for a source game with given candidates */
function setupFetchers(
  sourceGenres: string[],
  allGenres: Map<string, string[]>,
  candidateIds: string[]
) {
  vi.mocked(fetchGameGenreIds).mockResolvedValue(sourceGenres);
  vi.mocked(fetchAllGameGenres).mockResolvedValue(allGenres);
  vi.mocked(fetchCoOccurrences).mockResolvedValue({
    coOccurrences: [],
    sourceLibraryCount: 0,
  });
  vi.mocked(fetchReviewStats).mockResolvedValue(new Map());
  vi.mocked(fetchMetascores).mockResolvedValue(new Map());

  const metadataMap = new Map<string, GameRecommendation>();
  for (const id of candidateIds) metadataMap.set(id, makeMetadata(id));
  vi.mocked(fetchGameMetadata).mockResolvedValue(metadataMap);
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: cache miss
  vi.mocked(cacheGet).mockReturnValue(null);
});
// --- Tests ---

describe("getRecommendationsForGame", () => {
  /**
   * Validates: Requirement 8.3 — edge case with 0 candidates
   */
  it("returns empty array when there are 0 candidate games", async () => {
    const allGenres = new Map<string, string[]>();
    allGenres.set(SOURCE_ID, ["g1", "g2"]); // only the source game exists
    setupFetchers(["g1", "g2"], allGenres, []);

    const results = await getRecommendationsForGame(SOURCE_ID);

    expect(results).toEqual([]);
    expect(fetchGameGenreIds).toHaveBeenCalledWith(SOURCE_ID);
    expect(fetchAllGameGenres).toHaveBeenCalled();
  });

  /**
   * Validates: Requirement 8.2 — cache hit skips data fetchers
   */
  it("returns cached results without calling data fetchers on cache hit", async () => {
    const cachedRecs = [makeMetadata(CANDIDATE_A)];
    cachedRecs[0].combinedScore = 0.8;
    vi.mocked(cacheGet).mockReturnValue(cachedRecs);

    const results = await getRecommendationsForGame(SOURCE_ID);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(CANDIDATE_A);
    expect(fetchGameGenreIds).not.toHaveBeenCalled();
    expect(fetchAllGameGenres).not.toHaveBeenCalled();
    expect(fetchCoOccurrences).not.toHaveBeenCalled();
    expect(fetchReviewStats).not.toHaveBeenCalled();
  });

  /**
   * Validates: Requirement 8.2 — cache miss triggers fetchers and cacheSet
   */
  it("calls data fetchers and cacheSet on cache miss", async () => {
    const allGenres = new Map<string, string[]>();
    allGenres.set(SOURCE_ID, ["g1", "g2"]);
    allGenres.set(CANDIDATE_A, ["g1"]);
    setupFetchers(["g1", "g2"], allGenres, [CANDIDATE_A]);

    await getRecommendationsForGame(SOURCE_ID);

    expect(fetchGameGenreIds).toHaveBeenCalledWith(SOURCE_ID);
    expect(fetchAllGameGenres).toHaveBeenCalled();
    expect(fetchCoOccurrences).toHaveBeenCalledWith(SOURCE_ID);
    expect(fetchReviewStats).toHaveBeenCalled();
    expect(cacheSet).toHaveBeenCalledWith(`game:${SOURCE_ID}`, expect.any(Array));
  });

  /**
   * Validates: Requirement 8.2 — cached results still respect excludeGameIds
   */
  it("filters excluded game IDs from cached results", async () => {
    const cachedRecs = [
      { ...makeMetadata(CANDIDATE_A), combinedScore: 0.9 },
      { ...makeMetadata(CANDIDATE_B), combinedScore: 0.7 },
    ];
    vi.mocked(cacheGet).mockReturnValue(cachedRecs);

    const results = await getRecommendationsForGame(SOURCE_ID, {
      excludeGameIds: [CANDIDATE_A],
    });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(CANDIDATE_B);
  });

  /**
   * Validates: Requirements 7.3, 8.3 — basic scoring flow with ordering
   */
  it("scores candidates and returns them sorted by combinedScore", async () => {
    const allGenres = new Map<string, string[]>();
    allGenres.set(SOURCE_ID, ["g1", "g2", "g3"]);
    allGenres.set(CANDIDATE_A, ["g1"]); // Jaccard = 1/3
    allGenres.set(CANDIDATE_B, ["g1", "g2", "g3"]); // Jaccard = 3/3 = 1.0

    setupFetchers(["g1", "g2", "g3"], allGenres, [CANDIDATE_A, CANDIDATE_B]);

    const results = await getRecommendationsForGame(SOURCE_ID);

    expect(results).toHaveLength(2);
    // CANDIDATE_B has higher genre overlap → higher combined score
    expect(results[0].id).toBe(CANDIDATE_B);
    expect(results[1].id).toBe(CANDIDATE_A);
    expect(results[0].combinedScore).toBeGreaterThan(results[1].combinedScore);
  });
});

describe("getPersonalRecommendations", () => {
  /**
   * Validates: Requirement 7.3 — empty library returns empty array
   */
  it("returns empty array when user library is empty", async () => {
    vi.mocked(fetchUserLibraryGameIds).mockResolvedValue([]);

    const results = await getPersonalRecommendations(USER_ID);

    expect(results).toEqual([]);
    // Should not attempt to compute recommendations
    expect(fetchAllGameGenres).not.toHaveBeenCalled();
  });

  /**
   * Validates: Requirement 8.2 — personal cache hit
   */
  it("returns cached personal results without calling fetchers", async () => {
    const cachedRecs = [{ ...makeMetadata(CANDIDATE_A), combinedScore: 0.75 }];
    vi.mocked(cacheGet).mockReturnValue(cachedRecs);

    const results = await getPersonalRecommendations(USER_ID);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(CANDIDATE_A);
    expect(fetchUserLibraryGameIds).not.toHaveBeenCalled();
  });

  /**
   * Validates: Requirement 7.3 — deduplication across library games
   * When multiple library games produce overlapping candidates,
   * the highest combinedScore is kept.
   */
  it("deduplicates candidates keeping the highest score", async () => {
    const libGame1 = "lib-game-1";
    const libGame2 = "lib-game-2";

    vi.mocked(fetchUserLibraryGameIds).mockResolvedValue([libGame1, libGame2]);

    // Both library games share CANDIDATE_A as a candidate,
    // but with different genre overlaps → different scores
    const allGenres = new Map<string, string[]>();
    allGenres.set(libGame1, ["g1"]);
    allGenres.set(libGame2, ["g1", "g2", "g3"]);
    allGenres.set(CANDIDATE_A, ["g1", "g2", "g3"]); // better match with libGame2

    vi.mocked(fetchGameGenreIds).mockImplementation(async (gid) => allGenres.get(gid) ?? []);
    vi.mocked(fetchAllGameGenres).mockResolvedValue(allGenres);
    vi.mocked(fetchCoOccurrences).mockResolvedValue({
      coOccurrences: [],
      sourceLibraryCount: 0,
    });
    vi.mocked(fetchReviewStats).mockResolvedValue(new Map());
    vi.mocked(fetchMetascores).mockResolvedValue(new Map());

    const metadataMap = new Map<string, GameRecommendation>();
    metadataMap.set(CANDIDATE_A, makeMetadata(CANDIDATE_A));
    vi.mocked(fetchGameMetadata).mockResolvedValue(metadataMap);

    const results = await getPersonalRecommendations(USER_ID);

    // CANDIDATE_A should appear only once
    const candidateAResults = results.filter((r) => r.id === CANDIDATE_A);
    expect(candidateAResults).toHaveLength(1);

    // Library games should never appear in results
    const resultIds = results.map((r) => r.id);
    expect(resultIds).not.toContain(libGame1);
    expect(resultIds).not.toContain(libGame2);
  });
});
