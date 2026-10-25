/**
 * Recommendation service: thin layer over the SQL scoring RPCs
 * (`recommend_games_for_me`, `recommend_similar_games`, migration
 * 20261024000002) plus the card metadata of the picks.
 *
 * The whole catalogue is scored in one database pass (~1 s for a
 * 1 000-game library), so nothing is cached server-side: each call reflects
 * the current library and dismissals.
 */

import type { GameRecommendation } from "@/types/recommendation";
import type { RecommendationClient, RecommendationRow } from "./recommendation/client";
import { fetchGameMetadata } from "./recommendation/gameMetadata";

export interface RecommendationOptions {
  limit?: number;
  locale?: string;
}

export const DEFAULT_RECOMMENDATION_LIMIT = 10;
export const MAX_RECOMMENDATION_LIMIT = 50;

function clampLimit(limit: number | undefined): number {
  const value = limit ?? DEFAULT_RECOMMENDATION_LIMIT;
  return Math.min(Math.max(Math.trunc(value), 1), MAX_RECOMMENDATION_LIMIT);
}

async function hydrate(
  supabase: RecommendationClient,
  rows: RecommendationRow[],
  locale: string
): Promise<GameRecommendation[]> {
  const metadata = await fetchGameMetadata(
    supabase,
    rows.map((row) => row.game_id),
    locale
  );

  return rows.flatMap((row) => {
    const game = metadata.get(row.game_id);
    return game ? [{ ...game, combinedScore: row.score }] : [];
  });
}

async function callRpc(
  supabase: RecommendationClient,
  fn: string,
  args: Record<string, unknown>
): Promise<RecommendationRow[]> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(`${fn} failed: ${error.message}`);
  return (data ?? []) as RecommendationRow[];
}

/** Personal recommendations of the signed-in caller of `supabase`. */
export async function getPersonalRecommendations(
  supabase: RecommendationClient,
  options: RecommendationOptions = {}
): Promise<GameRecommendation[]> {
  const rows = await callRpc(supabase, "recommend_games_for_me", {
    p_limit: clampLimit(options.limit),
  });
  return hydrate(supabase, rows, options.locale ?? "en");
}

/** Games like `gameId`; signed-in callers do not get library or dismissed games. */
export async function getRecommendationsForGame(
  supabase: RecommendationClient,
  gameId: string,
  options: RecommendationOptions = {}
): Promise<GameRecommendation[]> {
  const rows = await callRpc(supabase, "recommend_similar_games", {
    p_game_id: gameId,
    p_limit: clampLimit(options.limit),
  });
  return hydrate(supabase, rows, options.locale ?? "en");
}

/** Number of games in the user's library (shown as "based on N games"). */
export async function countLibraryGames(supabase: RecommendationClient, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("user_library")
    .select("game_id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw new Error(`Failed to count library games: ${error.message}`);
  return count ?? 0;
}
