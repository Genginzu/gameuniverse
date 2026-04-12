import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { IGDBService } from "@/lib/services/igdbService";
import { fetchMetacriticScore } from "@/lib/services/metacriticService";
import { logger } from "@/lib/logger";

/**
 * POST /api/admin/global-sync/metascore
 * Fetches metascore for one game at a time (Metacritic has 2.5s rate limit).
 * Priority: Metacritic scrape → IGDB aggregated_rating → -1 sentinel.
 */
export async function POST(_request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();

    // One at a time due to Metacritic rate limiting
    const { data: entry, error: fetchError } = await supabase
      .from("igdb_global_sync")
      .select("id, igdb_id, name, matched_game_id")
      .eq("is_synced", true)
      .eq("is_enriched", true)
      .eq("is_colors_synced", true)
      .eq("is_metascore_synced", false)
      .not("matched_game_id", "is", null)
      .order("igdb_id", { ascending: true })
      .limit(1)
      .single();

    if (fetchError || !entry) {
      const { count } = await supabase
        .from("igdb_global_sync")
        .select("id", { count: "exact", head: true })
        .eq("is_synced", true)
        .eq("is_enriched", true)
        .eq("is_colors_synced", true)
        .eq("is_metascore_synced", false)
        .not("matched_game_id", "is", null);

      if ((count ?? 0) === 0) {
        return NextResponse.json({ done: true, remaining: 0 });
      }
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    const result = await syncMetascore(supabase, entry);

    const { count: remaining } = await supabase
      .from("igdb_global_sync")
      .select("id", { count: "exact", head: true })
      .eq("is_synced", true)
      .eq("is_enriched", true)
      .eq("is_colors_synced", true)
      .eq("is_metascore_synced", false)
      .not("matched_game_id", "is", null);

    return NextResponse.json({ ...result, remaining: remaining ?? 0 });
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
  source: "metacritic" | "igdb" | "none";
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncMetascore(supabase: any, entry: MetascoreEntry): Promise<MetascoreResult> {
  const base = { igdbId: entry.igdb_id, name: entry.name };

  try {
    // Get the game slug for Metacritic lookup
    const { data: game } = await supabase
      .from("games")
      .select("slug")
      .eq("id", entry.matched_game_id)
      .single();

    const slug = game?.slug as string | undefined;
    let score: number | null = null;
    let source: "metacritic" | "igdb" | "none" = "none";

    // Priority 1: Metacritic scrape
    if (slug) {
      const metacriticScore = await fetchMetacriticScore(slug);
      if (metacriticScore !== null) {
        score = metacriticScore;
        source = "metacritic";
      }
    }

    // Priority 2: IGDB aggregated_rating fallback
    if (score === null) {
      const igdbScore = await IGDBService.getAggregatedRating(entry.igdb_id);
      if (igdbScore !== null) {
        score = Math.round(igdbScore);
        source = "igdb";
      }
    }

    // Update game metascore (-1 sentinel if no score found)
    await supabase
      .from("games")
      .update({ metascore: score ?? -1 })
      .eq("id", entry.matched_game_id);

    // Mark as synced
    await supabase
      .from("igdb_global_sync")
      .update({ is_metascore_synced: true })
      .eq("id", entry.id);

    return { ...base, success: true, score, source };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.warn("Metascore sync failed", { igdbId: entry.igdb_id, error: msg });
    return { ...base, success: false, score: null, source: "none", error: msg };
  }
}
