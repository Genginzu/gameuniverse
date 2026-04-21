import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { IGDBService } from "@/lib/services/igdbService";
import { logger } from "@/lib/logger";

const IGDB_BATCH_SIZE = 500;

/**
 * POST /api/admin/global-sync/download
 * Fetches one batch of 500 games from IGDB using cursor-based pagination,
 * matches them against our DB, and inserts into igdb_global_sync.
 * Existing entries are skipped (ignoreDuplicates) to preserve their sync state.
 * Body: { afterId: number }
 * Returns: { inserted: number, hasMore: boolean, lastId: number }
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const afterId = parseInt(body.afterId ?? "0", 10);

    const supabase = getSupabaseAdmin();

    const games = await IGDBService.getGamesBatch(afterId, IGDB_BATCH_SIZE);
    const hasMore = games.length === IGDB_BATCH_SIZE;
    const lastId = games.length > 0 ? games[games.length - 1].id : afterId;

    if (games.length === 0) {
      return NextResponse.json({ inserted: 0, hasMore: false, lastId: afterId });
    }

    // Match against existing games in our DB by igdb_id
    const igdbIds = games.map((g) => g.id);
    const { data: existingGames } = await supabase
      .from("games")
      .select("id, igdb_id")
      .in("igdb_id", igdbIds);

    const igdbToGameMap = new Map<number, string>();
    if (existingGames) {
      for (const g of existingGames) {
        if (g.igdb_id) igdbToGameMap.set(g.igdb_id, g.id);
      }
    }

    // Insert new entries only — skip existing ones to preserve their sync state
    const rows = games.map((game) => ({
      igdb_id: game.id,
      name: game.name,
      cover_image_id: game.cover?.image_id || null,
      matched_game_id: igdbToGameMap.get(game.id) || null,
    }));

    const { error } = await supabase
      .from("igdb_global_sync")
      .upsert(rows, { onConflict: "igdb_id", ignoreDuplicates: true });

    if (error) {
      logger.error("Error inserting global sync batch", { error, afterId });
      return NextResponse.json({ error: "Failed to insert batch" }, { status: 500 });
    }

    return NextResponse.json({
      inserted: games.length,
      hasMore,
      lastId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    logger.error("Error in global-sync download", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
