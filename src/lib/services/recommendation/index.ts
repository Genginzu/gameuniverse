/**
 * Barrel export for recommendation scoring functions, types, and utilities.
 */

export { computeGenreScore, type GenreScoreInput } from "./genreScorer";
export { computeCollaborativeScore, type CollaborativeScoreInput } from "./collaborativeScorer";
export { computeReviewScore, type ReviewScoreInput } from "./reviewScorer";
export { computeMetacriticScore, type MetacriticScoreInput } from "./metacriticScorer";
export { DEFAULT_WEIGHTS, computeCombinedScore } from "./scoreCombiner";
export { cacheGet, cacheSet, cacheInvalidate, cacheClear } from "./cache";
export {
  computeOwnershipOverlap,
  getOwnershipOverlap,
  type OwnershipOverlapInput,
  type OwnershipOverlapResult,
} from "./ownershipOverlap";
