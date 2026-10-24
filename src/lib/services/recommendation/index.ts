/**
 * Recommendation helpers. Scoring itself lives in SQL (recommend_games RPC,
 * migration 20261024000002); see src/lib/services/recommendationService.ts.
 */

<<<<<<< HEAD
export { computeGenreScore, type GenreScoreInput } from "./genreScorer";
export { computeCollaborativeScore, type CollaborativeScoreInput } from "./collaborativeScorer";
export { computeReviewScore, type ReviewScoreInput } from "./reviewScorer";
export { computeMetacriticScore, type MetacriticScoreInput } from "./metacriticScorer";
export { DEFAULT_WEIGHTS, computeCombinedScore } from "./scoreCombiner";
=======
export { asRecommendationClient, type RecommendationClient, type RecommendationRow } from "./client";
export { fetchGameMetadata, type GameMetadata } from "./gameMetadata";
export {
  computeOwnershipOverlap,
  getOwnershipOverlap,
  type OwnershipOverlapInput,
  type OwnershipOverlapResult,
} from "./ownershipOverlap";
>>>>>>> 9d318f8 (feat: #447 rpc-based recommendations with dismiss and reasons)
