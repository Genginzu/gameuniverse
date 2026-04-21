import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { IGDBService } from "@/lib/services/igdbService";
import {
  syncScreenshots,
  syncArtworks,
  syncAgeRatings,
  syncLanguages,
  syncVideos,
} from "@/lib/services/igdb-sync-fields";
import { logger } from "@/lib/logger";
import type { IGDBGame, IGDBGameVersion, IGDBTimeToBeat } from "@/types/igdb";
import type { SyncSupabaseClient } from "@/lib/services/igdb-sync";

const BATCH_SIZE = 20;

/**
 * POST /api/admin/global-sync/enrich
 * Phase 2: Enriches synced games with IGDB data (no color extraction).
 * Fetches all IGDB data in 4 batch calls, then processes DB writes.
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

    const igdbIds = entries.map((e) => e.igdb_id);

    // 4 batch IGDB calls instead of 4×N individual calls
    const [igdbMap, versionsMap, playtimeMap, popularityMap] = await Promise.all([
      IGDBService.getGameDetailsBatch(igdbIds),
      IGDBService.getGameVersionsBatch(igdbIds),
      IGDBService.getTimeToBeatBatch(igdbIds),
      IGDBService.getPopularityPrimitivesBatch(igdbIds),
    ]);

    const results = await Promise.all(
      entries.map((e) =>
        enrichOneGame(supabase, e, igdbMap, versionsMap, playtimeMap, popularityMap)
      )
    );

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
type SupabaseAdmin = any;

async function enrichOneGame(
  supabase: SupabaseAdmin,
  entry: EnrichEntry,
  igdbMap: Map<number, IGDBGame>,
  versionsMap: Map<number, IGDBGameVersion[]>,
  playtimeMap: Map<number, IGDBTimeToBeat>,
  popularityMap: Map<number, { visits: number | null; wantToPlay: number | null; playing: number | null }>
): Promise<EnrichResult> {
  const base = { igdbId: entry.igdb_id, name: entry.name };
  try {
    const gameId = entry.matched_game_id;
    const igdb = igdbMap.get(entry.igdb_id);

    if (!igdb) {
      logger.warn("Game not found on IGDB during enrichment, removing from global sync", {
        igdbId: entry.igdb_id,
        name: entry.name,
      });
      await supabase.from("igdb_global_sync").delete().eq("id", entry.id);
      return { ...base, success: false, error: "Not found on IGDB (removed)" };
    }

    await Promise.all([
      syncScreenshots(supabase, gameId, igdb),
      syncArtworks(supabase, gameId, igdb),
      syncAgeRatings(supabase, gameId, igdb),
      syncVersionsFromData(supabase, gameId, versionsMap.get(entry.igdb_id) ?? []),
      syncLanguages(supabase, gameId, igdb),
      syncPlaytimeFromData(supabase, gameId, playtimeMap.get(entry.igdb_id) ?? null),
      syncPopularityFromData(
        supabase as SyncSupabaseClient,
        gameId,
        popularityMap.get(entry.igdb_id) ?? null
      ),
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

// --- Inline sync helpers that accept pre-fetched data ---

async function syncVersionsFromData(
  supabase: SupabaseAdmin,
  gameId: string,
  versions: IGDBGameVersion[]
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("game_versions").delete().eq("game_id", gameId);

  for (let i = 0; i < versions.length; i++) {
    const v = versions[i];
    const coverUrl = v.cover?.image_id
      ? IGDBService.buildImageUrl(v.cover.image_id, "cover_big")
      : null;
    await supabase
      .from("game_versions")
      .insert({
        game_id: gameId,
        igdb_id: v.id,
        version_title: v.version_title || v.name,
        description: v.summary || null,
        cover_image_url: coverUrl,
        display_order: i,
      })
      .select("id")
      .single();
  }
}

async function syncPlaytimeFromData(
  supabase: SupabaseAdmin,
  gameId: string,
  timeToBeat: IGDBTimeToBeat | null
): Promise<void> {
  const toHours = (s: number | null | undefined): number | null => {
    if (s === null || s === undefined || s === 0 || isNaN(s)) return null;
    return Math.round((s / 3600) * 10) / 10;
  };
  await supabase
    .from("games")
    .update({
      playtime_hastily: timeToBeat ? toHours(timeToBeat.hastily) : null,
      playtime_normally: timeToBeat ? toHours(timeToBeat.normally) : null,
      playtime_completely: timeToBeat ? toHours(timeToBeat.completely) : null,
      playtime_updated_at: new Date().toISOString(),
    })
    .eq("id", gameId);
}

async function syncPopularityFromData(
  supabase: SyncSupabaseClient,
  gameId: string,
  data: { visits: number | null; wantToPlay: number | null; playing: number | null } | null
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("games") as any)
    .update({
      igdb_pop_visits: data?.visits ?? null,
      igdb_pop_want_to_play: data?.wantToPlay ?? null,
      igdb_pop_playing: data?.playing ?? null,
      igdb_pop_updated_at: new Date().toISOString(),
    })
    .eq("id", gameId);
}
