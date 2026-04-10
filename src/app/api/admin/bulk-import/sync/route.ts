import { NextRequest, NextResponse } from "next/server";
import { GameImportService } from "@/lib/services/gameImportService";
import { logger } from "@/lib/logger";

/**
 * POST /api/admin/bulk-import/sync
 * Triggers a sync for a batch of games by their IGDB IDs.
 * Body: { gameIds: Array<{ id: string; igdbId: number }> }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const gameIds: Array<{ id: string; igdbId: number }> = body.gameIds;

    if (!Array.isArray(gameIds) || gameIds.length === 0) {
      return NextResponse.json({ error: "gameIds array is required" }, { status: 400 });
    }

    if (gameIds.length > 400) {
      return NextResponse.json({ error: "Maximum 400 games per batch" }, { status: 400 });
    }

    const results: Array<{ igdbId: number; success: boolean; error?: string }> = [];
    let successCount = 0;

    for (const { id, igdbId } of gameIds) {
      try {
        const result = await GameImportService.syncWithIGDB(id, igdbId);
        results.push({ igdbId, success: result.success, error: result.error });
        if (result.success) successCount++;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        results.push({ igdbId, success: false, error: message });
        logger.error("Bulk sync failed for game", { igdbId, error });
      }
    }

    return NextResponse.json({
      total: gameIds.length,
      success: successCount,
      failed: gameIds.length - successCount,
      results,
    });
  } catch (error) {
    logger.error("Error in bulk import sync endpoint", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
