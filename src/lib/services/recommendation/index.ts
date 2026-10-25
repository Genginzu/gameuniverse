/**
 * Recommendation helpers. Scoring itself lives in SQL (recommend_games RPC,
 * migration 20261024000002); see src/lib/services/recommendationService.ts.
 */

export { asRecommendationClient, type RecommendationClient, type RecommendationRow } from "./client";
export { fetchGameMetadata, type GameMetadata } from "./gameMetadata";
