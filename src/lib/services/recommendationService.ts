/**
 * Recommendation service — orchestrates scoring and data fetching
 * to produce game recommendations.
 *
 * Two main entry points:
 * - getRecommendationsForGame: recommendations based on a single game
 * - getPersonalRecommendations: aggregated recommendations for a user's library
 *
 * Results are cached in-memory with a configurable TTL (default: 1 hour).
 */

import type { GameRecommendation, ScoringWeights } from "@/types/recommendation";
import {
  computeGenreScore,
  computeCollaborativeScore,
  computeReviewScore,
  computeCombinedScore,
  DEFAULT_WEIGHTS,
} from "@/lib/services/recommendation";
import { cacheGet, cacheSet } from "@/lib/services/recommendation/cache";
import {
  fetchGameGenreIds,
  fetchAllGameGenres,
  fetchCoOccurrences,
  fetchReviewStats,
  fetchGameMetadata,
  fetchUserLibraryGameIds,
} from "@/lib/services/recommendation/dataFetchers";

export interface RecommendationOptions {
  limit?: number;
  excludeGameIds?: string[];
  weights?: Partial<ScoringWeights>;
}

const DEFAULT_LIMIT = 10;
const MIN_REVIEWS_FOR_FULL_CONFIDENCE = 3;

/** Build the full weights object, merging user overrides with defaults */
function resolveWeights(partial?: Partial<ScoringWeights>): ScoringWeights {
  return { ...DEFAULT_WEIGHTS, ...partial };
}

/**
 * Get recommendations for a specific game.
 *
 * Fetches genres, co-occurrences, and review stats, then scores
 * every candidate game and returns the top N results.
 */
export async function getRecommendationsForGame(
  gameId: string,
  options?: RecommendationOptions
): Promise<GameRecommendation[]> {
  const limit = options?.limit ?? DEFAULT_LIMIT;
  const excludeIds = new Set(options?.excludeGameIds ?? []);
  const weights = resolveWeights(options?.weights);

  // Check cache first
  const cacheKey = `game:${gameId}`;
  const cached = cacheGet<GameRecommendation[]>(cacheKey);
  if (cached) {
    // Apply exclusion and limit on cached results (library may have changed)
    return cached.filter((r) => !excludeIds.has(r.id)).slice(0, limit);
  }

  // Fetch all data in parallel
  const [sourceGenreIds, allGameGenres, coOccurrenceData, reviewStatsMap] = await Promise.all([
    fetchGameGenreIds(gameId),
    fetchAllGameGenres(),
    fetchCoOccurrences(gameId),
    fetchReviewStats(),
  ]);

  // Score every candidate game
  const scoredCandidates = scoreCandidates(
    gameId,
    sourceGenreIds,
    allGameGenres,
    coOccurrenceData,
    reviewStatsMap,
    weights
  );

  // Sort by combined score descending
  scoredCandidates.sort((a, b) => b.score - a.score);

  // Take top results (generous limit for caching, actual limit applied after)
  const topCandidateIds = scoredCandidates.slice(0, Math.max(limit * 3, 30)).map((c) => c.gameId);

  // Fetch metadata for top candidates
  const metadataMap = await fetchGameMetadata(topCandidateIds);

  // Build final recommendations
  const allRecommendations = buildRecommendations(scoredCandidates, metadataMap);

  // Cache the full (unfiltered) results
  cacheSet(cacheKey, allRecommendations);

  // Apply exclusion and limit
  return allRecommendations.filter((r) => !excludeIds.has(r.id)).slice(0, limit);
}

/**
 * Get personalized recommendations for a user.
 *
 * Aggregates recommendations from all games in the user's library,
 * deduplicates by keeping the max combinedScore per candidate.
 */
export async function getPersonalRecommendations(
  userId: string,
  options?: RecommendationOptions
): Promise<GameRecommendation[]> {
  const limit = options?.limit ?? DEFAULT_LIMIT;
  const weights = resolveWeights(options?.weights);

  // Check cache first
  const cacheKey = `personal:${userId}`;
  const cached = cacheGet<GameRecommendation[]>(cacheKey);
  if (cached) return cached.slice(0, limit);

  const libraryGameIds = await fetchUserLibraryGameIds(userId);
  if (libraryGameIds.length === 0) return [];

  // Get recommendations for each library game, excluding all library games
  const librarySet = new Set(libraryGameIds);
  const scoreByCandidate = new Map<string, GameRecommendation>();

  for (const libraryGameId of libraryGameIds) {
    const recs = await getRecommendationsForGame(libraryGameId, {
      // Use a generous limit per source game to get good candidates
      limit: Math.max(limit * 2, 20),
      excludeGameIds: libraryGameIds,
      weights,
    });

    // Deduplicate: keep the max combinedScore for each candidate
    for (const rec of recs) {
      const existing = scoreByCandidate.get(rec.id);
      if (!existing || rec.combinedScore > existing.combinedScore) {
        scoreByCandidate.set(rec.id, rec);
      }
    }
  }

  // Sort by combinedScore descending and limit
  const aggregated = Array.from(scoreByCandidate.values())
    .filter((r) => !librarySet.has(r.id))
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, limit);

  cacheSet(cacheKey, aggregated);
  return aggregated;
}

// --- Internal helpers ---

interface ScoredCandidate {
  gameId: string;
  score: number;
}

/** Score all candidate games against the source game */
function scoreCandidates(
  sourceGameId: string,
  sourceGenreIds: string[],
  allGameGenres: Map<string, string[]>,
  coOccurrenceData: Awaited<ReturnType<typeof fetchCoOccurrences>>,
  reviewStatsMap: Map<string, { averageRating: number; reviewCount: number }>,
  weights: ScoringWeights
): ScoredCandidate[] {
  const coOccurrenceMap = new Map<string, number>();
  for (const row of coOccurrenceData.coOccurrences) {
    coOccurrenceMap.set(row.candidateGameId, row.coOccurrenceCount);
  }

  const candidates: ScoredCandidate[] = [];

  for (const [candidateId, candidateGenreIds] of allGameGenres) {
    // Exclude the source game itself (Requirement 1.3)
    if (candidateId === sourceGameId) continue;

    const genreScore = computeGenreScore({
      sourceGenreIds,
      candidateGenreIds,
    });

    const collaborativeScore = computeCollaborativeScore({
      sourceGameId,
      candidateGameId: candidateId,
      coOccurrenceCount: coOccurrenceMap.get(candidateId) ?? 0,
      sourceGameLibraryCount: coOccurrenceData.sourceLibraryCount,
    });

    const reviewStats = reviewStatsMap.get(candidateId);
    const reviewScore = computeReviewScore({
      averageRating: reviewStats?.averageRating ?? null,
      reviewCount: reviewStats?.reviewCount ?? 0,
      minReviewsForFullConfidence: MIN_REVIEWS_FOR_FULL_CONFIDENCE,
    });

    const score = computeCombinedScore({ genreScore, collaborativeScore, reviewScore }, weights);

    candidates.push({ gameId: candidateId, score });
  }

  return candidates;
}

/** Map scored candidates to full GameRecommendation objects */
function buildRecommendations(
  scoredCandidates: ScoredCandidate[],
  metadataMap: Map<string, GameRecommendation>
): GameRecommendation[] {
  const recommendations: GameRecommendation[] = [];

  for (const candidate of scoredCandidates) {
    const metadata = metadataMap.get(candidate.gameId);
    if (!metadata) continue;

    recommendations.push({
      ...metadata,
      combinedScore: candidate.score,
    });
  }

  return recommendations;
}
