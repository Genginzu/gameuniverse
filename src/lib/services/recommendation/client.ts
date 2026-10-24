/**
 * Minimal Supabase surface used by the recommendation service: table reads
 * plus the recommendation RPCs (migration 20261024000002, not yet in the
 * generated types). Accepts the route-handler or the server client.
 */

export interface RecommendationRow {
  game_id: string;
  score: number;
  content_score: number;
  similar_score: number;
  collaborative_score: number;
  quality_score: number;
  reason_game_id: string | null;
}

type QueryResult = PromiseLike<{
  data: unknown;
  error: { message: string } | null;
  count?: number | null;
}>;

// The query builder is deeply generic; the service only chains filters on it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryBuilder = any;

export interface RecommendationClient {
  from: (table: string) => QueryBuilder;
  rpc: (fn: string, args: Record<string, unknown>) => QueryResult;
}

export function asRecommendationClient(supabase: unknown): RecommendationClient {
  return supabase as RecommendationClient;
}
