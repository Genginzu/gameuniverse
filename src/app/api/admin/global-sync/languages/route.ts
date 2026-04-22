import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { IGDBService } from "@/lib/services/igdbService";
import { syncLanguages } from "@/lib/services/igdb-sync-fields";
import { logger } from "@/lib/logger";

const BATCH_SIZE = 100;

export async function POST(_request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();

    const { data: entries, error: fetchError } = await supabase
      .from("igdb_global_sync")
      .select("id, igdb_id, name, matched_game_id")
      .eq("is_synced", true)
      .eq("is_languages_synced", false)
      .not("matched_game_id", "is", null)
      .order("igdb_id", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      logger.error("Error fetching for languages sync", { fetchError });
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
    if (!entries || entries.length === 0) {
      return NextResponse.json({ results: [], done: true, remaining: 0 });
    }

    const igdbIds = entries.map((e) => e.igdb_id);
    const igdbMap = await IGDBService.getLanguagesBatch(igdbIds);

    const results: Array<{ igdbId: number; name: string; success: boolean; error?: string }> = [];
    for (let i = 0; i < entries.length; i += 10) {
      const chunk = entries.slice(i, i + 10);
      const chunkResults = await Promise.all(
        chunk.map(async (entry) => {
          try {
            const igdbGame = igdbMap.get(entry.igdb_id);
            if (igdbGame) await syncLanguages(supabase, entry.matched_game_id, igdbGame);
            await supabase.from("igdb_global_sync").update({ is_languages_synced: true }).eq("id", entry.id);
            return { igdbId: entry.igdb_id, name: entry.name, success: true };
          } catch (error) {
            return { igdbId: entry.igdb_id, name: entry.name, success: false, error: (error as Error).message };
          }
        })
      );
      results.push(...chunkResults);
    }

    const { count: remaining } = await supabase
      .from("igdb_global_sync")
      .select("id", { count: "exact", head: true })
      .eq("is_synced", true)
      .eq("is_languages_synced", false)
      .not("matched_game_id", "is", null);

    return NextResponse.json({ results, done: false, remaining: remaining ?? 0 });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    logger.error("Error in global-sync languages", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
