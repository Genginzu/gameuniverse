import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { IGDBService } from "@/lib/services/igdbService";
import { logger } from "@/lib/logger";

const BATCH_SIZE = 200;

export async function POST(_request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();

    const { data: entries, error: fetchError } = await supabase
      .from("igdb_global_sync")
      .select("id, igdb_id, name, matched_game_id")
      .eq("is_synced", true)
      .eq("is_popularity_synced", false)
      .not("matched_game_id", "is", null)
      .order("igdb_id", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      logger.error("Error fetching for popularity sync", { fetchError });
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
    if (!entries || entries.length === 0) {
      return NextResponse.json({ results: [], done: true, remaining: 0 });
    }

    const igdbIds = entries.map((e) => e.igdb_id);
    const popMap = await IGDBService.getPopularityBatch(igdbIds);

    // Bulk upsert games with popularity data
    const now = new Date().toISOString();
    const gameRows = entries.map((entry) => {
      const data = popMap.get(entry.igdb_id);
      return {
        id: entry.matched_game_id,
        igdb_pop_visits: data?.visits ?? null,
        igdb_pop_want_to_play: data?.wantToPlay ?? null,
        igdb_pop_playing: data?.playing ?? null,
        igdb_pop_updated_at: now,
      };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("games") as any).upsert(gameRows, {
      onConflict: "id",
      ignoreDuplicates: false,
    });

    // Bulk update sync flags
    const syncIds = entries.map((e) => e.id);
    await supabase
      .from("igdb_global_sync")
      .update({ is_popularity_synced: true })
      .in("id", syncIds);

    const results = entries.map((e) => ({ igdbId: e.igdb_id, name: e.name, success: true }));

    const { count: remaining } = await supabase
      .from("igdb_global_sync")
      .select("id", { count: "exact", head: true })
      .eq("is_synced", true)
      .eq("is_popularity_synced", false)
      .not("matched_game_id", "is", null);

    return NextResponse.json({ results, done: false, remaining: remaining ?? 0 });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    logger.error("Error in global-sync popularity", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
