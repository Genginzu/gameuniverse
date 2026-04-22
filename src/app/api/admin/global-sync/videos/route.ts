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
      .eq("is_videos_synced", false)
      .not("matched_game_id", "is", null)
      .order("igdb_id", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      logger.error("Error fetching for videos sync", { fetchError });
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
    if (!entries || entries.length === 0) {
      return NextResponse.json({ results: [], done: true, remaining: 0 });
    }

    const igdbIds = entries.map((e) => e.igdb_id);
    const igdbMap = await IGDBService.getVideosBatch(igdbIds);

    const gameIds = entries.map((e) => e.matched_game_id);
    await supabase.from("game_videos").delete().in("game_id", gameIds);

    const allRows: Array<Record<string, unknown>> = [];
    for (const entry of entries) {
      const videos = (igdbMap.get(entry.igdb_id) ?? []).filter((v) => v.video_id);
      for (let i = 0; i < videos.length; i++) {
        allRows.push({
          game_id: entry.matched_game_id,
          url: `https://www.youtube.com/watch?v=${videos[i].video_id}`,
          thumbnail_url: `https://img.youtube.com/vi/${videos[i].video_id}/hqdefault.jpg`,
          title: videos[i].name || "Trailer",
          video_type: "trailer",
          display_order: i,
          is_featured: i === 0,
        });
      }
    }

    if (allRows.length > 0) {
      await supabase.from("game_videos").insert(allRows);
    }

    const syncIds = entries.map((e) => e.id);
    await supabase.from("igdb_global_sync").update({ is_videos_synced: true }).in("id", syncIds);

    const results = entries.map((e) => ({ igdbId: e.igdb_id, name: e.name, success: true }));

    const { count: remaining } = await supabase
      .from("igdb_global_sync")
      .select("id", { count: "exact", head: true })
      .eq("is_synced", true)
      .eq("is_videos_synced", false)
      .not("matched_game_id", "is", null);

    return NextResponse.json({ results, done: false, remaining: remaining ?? 0 });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    logger.error("Error in global-sync videos", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
