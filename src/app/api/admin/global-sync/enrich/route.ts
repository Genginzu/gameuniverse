import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { IGDBService } from "@/lib/services/igdbService";
import {
  syncScreenshots,
  syncArtworks,
  syncAgeRatings,
  syncVersions,
  syncLanguages,
  syncPlaytime,
  syncVideos,
} from "@/lib/services/igdb-sync-fields";
import { logger } from "@/lib/logger";

const BATCH_SIZE = 2;

/**
 * POST /api/admin/global-sync/enrich
 * Phase 2: Enriches synced games with IGDB data (no color extraction).
 * Screenshots, artworks, age ratings, versions, languages, playtime, videos, similar games.
 */
export async function POST(_request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();

    const { data: entries, error: fetchError } = await supabase
      .from("igdb_global_sync")
      .select("id, igdb_id, name, matched_game_id")
      .eq("is_synced", true)
      .eq("is_enriched", false)
      .not("matched_game_id", "is", null)
      .order("igdb_id", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      logger.error("Error fetching games for enrichment", { fetchError });
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({ results: [], done: true, remaining: 0 });
    }

    const results = await Promise.all(entries.map((e) => enrichOneGame(supabase, e)));

    const { count: remaining } = await supabase
      .from("igdb_global_sync")
      .select("id", { count: "exact", head: true })
      .eq("is_synced", true)
      .eq("is_enriched", false)
      .not("matched_game_id", "is", null);

    return NextResponse.json({ results, done: false, remaining: remaining ?? 0 });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    logger.error("Error in global-sync enrich", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

interface EnrichEntry {
  id: number;
  igdb_id: number;
  name: string;
  matched_game_id: string;
}

interface EnrichResult {
  success: boolean;
  igdbId: number;
  name: string;
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function enrichOneGame(supabase: any, entry: EnrichEntry): Promise<EnrichResult> {
  const base = { igdbId: entry.igdb_id, name: entry.name };
  try {
    const gameId = entry.matched_game_id;
    const igdb = await IGDBService.getGameDetails(entry.igdb_id);

    if (!igdb) {
      await supabase.from("igdb_global_sync").update({ is_enriched: true }).eq("id", entry.id);
      return { ...base, success: false, error: "Not found on IGDB" };
    }

    await Promise.all([
      syncScreenshots(supabase, gameId, igdb),
      syncArtworks(supabase, gameId, igdb),
      syncAgeRatings(supabase, gameId, igdb),
      syncVersions(supabase, gameId, entry.igdb_id),
      syncLanguages(supabase, gameId, igdb),
      syncPlaytime(supabase, gameId, entry.igdb_id),
      syncVideos(supabase, gameId, igdb),
    ]);

    await supabase.from("igdb_global_sync").update({ is_enriched: true }).eq("id", entry.id);
    return { ...base, success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.warn("Enrichment failed", { igdbId: entry.igdb_id, error: msg });
    return { ...base, success: false, error: msg };
  }
}
