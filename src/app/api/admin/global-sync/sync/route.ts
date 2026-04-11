import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { GameImportService } from "@/lib/services/gameImportService";
import { logger } from "@/lib/logger";

/**
 * POST /api/admin/global-sync/sync
 * Takes the next unsynced game from igdb_global_sync,
 * imports/syncs it via GameImportService, and marks it as synced.
 * Returns: { success, igdbId, name, error?, remaining }
 */
export async function POST(_request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();

    // Get next unsynced game
    const { data: entry, error: fetchError } = await supabase
      .from("igdb_global_sync")
      .select("id, igdb_id, name")
      .eq("is_synced", false)
      .order("igdb_id", { ascending: true })
      .limit(1)
      .single();

    if (fetchError || !entry) {
      // Count remaining to distinguish "all done" from error
      const { count } = await supabase
        .from("igdb_global_sync")
        .select("id", { count: "exact", head: true })
        .eq("is_synced", false);

      if ((count ?? 0) === 0) {
        return NextResponse.json({ success: true, done: true, remaining: 0 });
      }
      logger.error("Error fetching next unsynced game", { fetchError });
      return NextResponse.json({ error: "Failed to fetch next game" }, { status: 500 });
    }

    // Import or sync the game
    const result = await GameImportService.importFromIGDB(entry.igdb_id);

    if (!result.success) {
      logger.warn("Global sync: import failed, keeping for retry", {
        igdbId: entry.igdb_id,
        name: entry.name,
        error: result.error,
      });
      return NextResponse.json({
        success: false,
        igdbId: entry.igdb_id,
        name: entry.name,
        error: result.error,
      });
    }

    // Mark as synced + update matched_game_id
    const gameId = result.game?.id ?? null;
    const updateData: Record<string, unknown> = { is_synced: true };
    if (gameId) updateData.matched_game_id = gameId;

    await supabase.from("igdb_global_sync").update(updateData).eq("id", entry.id);

    // Get remaining count
    const { count: remaining } = await supabase
      .from("igdb_global_sync")
      .select("id", { count: "exact", head: true })
      .eq("is_synced", false);

    return NextResponse.json({
      success: true,
      igdbId: entry.igdb_id,
      name: entry.name,
      remaining: remaining ?? 0,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    logger.error("Error in global-sync sync", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
