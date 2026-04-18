import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export interface OwnershipOverlapInput {
  aGames: Set<string>;
  bGames: Set<string>;
}

export interface OwnershipOverlapResult {
  /** Jaccard similarity (0..1): |A∩B| / |A∪B|. 0 when both sets are empty. */
  jaccard: number;
  /** Number of games owned by both players. */
  intersection: number;
  /** Total distinct games across both libraries. */
  union: number;
}

/**
 * Pure computation: given two libraries (as sets of game_id), return the
 * Jaccard similarity and overlap counts. Kept framework-free so it can be
 * unit-tested without Supabase.
 */
export function computeOwnershipOverlap({
  aGames,
  bGames,
}: OwnershipOverlapInput): OwnershipOverlapResult {
  if (aGames.size === 0 && bGames.size === 0) {
    return { jaccard: 0, intersection: 0, union: 0 };
  }

  let intersection = 0;
  const smaller = aGames.size <= bGames.size ? aGames : bGames;
  const larger = smaller === aGames ? bGames : aGames;
  for (const id of smaller) {
    if (larger.has(id)) intersection += 1;
  }

  const union = aGames.size + bGames.size - intersection;
  const jaccard = union === 0 ? 0 : intersection / union;
  return { jaccard, intersection, union };
}

async function fetchSyncedGameIds(
  supabase: SupabaseClient<Database>,
  playerId: string
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("user_library")
    .select("game_id")
    .eq("user_id", playerId)
    .not("source_platform", "is", null);

  if (error) throw error;
  return new Set((data ?? []).map((row) => row.game_id));
}

/**
 * Compute the ownership overlap between two players, restricted to entries
 * imported from an external platform (source_platform IS NOT NULL).
 */
export async function getOwnershipOverlap(
  supabase: SupabaseClient<Database>,
  playerIdA: string,
  playerIdB: string
): Promise<OwnershipOverlapResult> {
  const [aGames, bGames] = await Promise.all([
    fetchSyncedGameIds(supabase, playerIdA),
    fetchSyncedGameIds(supabase, playerIdB),
  ]);
  return computeOwnershipOverlap({ aGames, bGames });
}
