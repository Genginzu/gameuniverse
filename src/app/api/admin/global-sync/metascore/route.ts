import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { fetchMetacriticScore } from "@/lib/services/metacriticService";
import { logger } from "@/lib/logger";

const BATCH_SIZE = 3;

/**
 * POST /api/admin/global-sync/metascore
 * Fetches metascore for a small batch sequentially (Metacritic rate limit).
 * Fetches metascore from Metacritic only.
 */
export async function POST(_request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();

    const { data: entries, error: fetchError } = await supabase
      .from("igdb_global_sync")
      .select("id, igdb_id, name, matched_game_id")
      .eq("is_synced", true)
      .eq("is_metascore_synced", false)
      .not("matched_game_id", "is", null)
      .order("igdb_id", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      logger.error("Error fetching for metascore sync", { fetchError });
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({ results: [], done: true, remaining: 0 });
    }

    // Process sequentially to respect Metacritic rate limit
    const results: MetascoreResult[] = [];
    for (const entry of entries) {
      results.push(await syncMetascore(supabase, entry));
    }

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
  source: "metacritic" | "none";
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncMetascore(supabase: any, entry: MetascoreEntry): Promise<MetascoreResult> {
  const base = { igdbId: entry.igdb_id, name: entry.name };

  try {
    const { data: game } = await supabase
      .from("games")
      .select("slug")
      .eq("id", entry.matched_game_id)
      .single();

    const slug = game?.slug as string | undefined;
    let score: number | null = null;
    let source: "metacritic" | "none" = "none";

    if (slug) {
      const metacriticScore = await fetchMetacriticScore(slug);
      if (metacriticScore !== null) {
        score = metacriticScore;
        source = "metacritic";
      }
    }


    await supabase
      .from("games")
      .update({ metascore: score ?? null })
      .eq("id", entry.matched_game_id);

    await supabase
      .from("igdb_global_sync")
      .update({ is_metascore_synced: true })
      .eq("id", entry.id);
    return { ...base, success: true, score, source };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.warn("Metascore sync failed", { igdbId: entry.igdb_id, error: msg });
    await supabase
      .from("igdb_global_sync")
      .update({ is_metascore_synced: true })
      .eq("id", entry.id);
    return { ...base, success: false, score: null, source: "none", error: msg };
  }
}
