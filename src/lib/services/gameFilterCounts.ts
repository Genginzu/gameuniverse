/**
 * Number of games behind each option of the games listing filters, grouped in
 * SQL by the `get_game_filter_counts` RPC. Counting link-table rows in JS is
 * wrong: PostgREST truncates those selects at max_rows (1000).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { logger } from "@/lib/logger";

export type GameFilterFacet = "genre" | "platform" | "theme" | "game_mode" | "perspective";

/** Game count per reference id, for each facet. */
export type GameFilterCounts = Record<GameFilterFacet, Map<string, number>>;

function emptyCounts(): GameFilterCounts {
  return {
    genre: new Map(),
    platform: new Map(),
    theme: new Map(),
    game_mode: new Map(),
    perspective: new Map(),
  };
}

const FACETS: ReadonlySet<string> = new Set<GameFilterFacet>([
  "genre",
  "platform",
  "theme",
  "game_mode",
  "perspective",
]);

function isFacet(value: string): value is GameFilterFacet {
  return FACETS.has(value);
}

/** Never throws: a failure only hides the counts, it must not break the filters. */
export async function fetchGameFilterCounts(
  supabase: SupabaseClient<Database>
): Promise<GameFilterCounts> {
  const counts = emptyCounts();
  const { data, error } = await supabase.rpc("get_game_filter_counts");
  if (error) {
    logger.error("Error fetching game filter counts", { error });
    return counts;
  }
  for (const row of data ?? []) {
    if (isFacet(row.facet)) counts[row.facet].set(row.ref_id, Number(row.game_count));
  }
  return counts;
}
