import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { IGDBService } from "@/lib/services/igdbService";
import { logger } from "@/lib/logger";

const BATCH_SIZE = 10;

/**
 * POST /api/admin/global-sync/metascore
 * Fetches IGDB aggregated_rating for a batch of games that haven't
 * had their metascore synced yet. Uses a lightweight IGDB query.
 */
export async function POST(_request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();

    // Get games that are synced but metascore not yet fetched
    const { data: entries, error: fetchError } = await supabase
      .from("igdb_global_sync")
      .select("id, igdb_id, name, matched_game_id")
      .eq("is_synced", true)
      .eq("is_metascore_synced", false)
      .not("matched_game_id", "is", null)
      .order("igdb_id", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      logger.error("Error fetching games for metascore sync", { fetchError });
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({ results: [], done: true, remaining: 0 });
    }

    // Fetch metascores in parallel with lightweight IGDB queries
    const results = await Promise.all(entries.map((e) => syncMetascore(supabase, e)));

    const { count: remaining } = await supabase
      .from("igdb_global_sync")
      .select("id", { count: "exact", head: true })
      .eq("is_synced", true)
      .eq("is_metascore_synced", false)
      .not("matched_game_id", "is", null);

    return NextResponse.json({ results, done: false, remaining: remaining ?? 0 });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    logger.error("Error in global-sync metascore", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

interface MetascoreEntry {
  id: number;
  igdb_id: number;
  name: string;
  matched_game_id: string;
}

interface MetascoreResult {
  success: boolean;
  igdbId: number;
  name: string;
  score: number | null;
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncMetascore(supabase: any, entry: MetascoreEntry): Promise<MetascoreResult> {
  const base = { igdbId: entry.igdb_id, name: entry.name };
  try {
    const score = await IGDBService.getAggregatedRating(entry.igdb_id);
    const rounded = score !== null ? Math.round(score) : null;

    // Update game metascore (use -1 sentinel if no score available)
    await supabase
      .from("games")
      .update({ metascore: rounded ?? -1 })
      .eq("id", entry.matched_game_id);

    // Mark metascore as synced
    await supabase
      .from("igdb_global_sync")
      .update({ is_metascore_synced: true })
      .eq("id", entry.id);

    return { ...base, success: true, score: rounded };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.warn("Metascore sync failed", { igdbId: entry.igdb_id, error: msg });
    return { ...base, success: false, score: null, error: msg };
  }
}
