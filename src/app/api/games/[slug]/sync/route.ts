import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { GameImportService } from "@/lib/services/gameImportService";
import { logger } from "@/lib/logger";

/**
 * POST /api/games/[slug]/sync
 *
 * Triggers a background synchronization of a game with IGDB data.
 * Returns immediately (fire-and-forget pattern) while the sync happens in the background.
 *
 * The game must exist locally and have an igdb_id to be synchronized.
 *
 * Returns:
 * - 202: Sync initiated (fire-and-forget)
 * - 400: Game has no IGDB ID
 * - 404: Game not found
 * - 500: Internal server error
 *
 * Requirements: 4.2, 4.3
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Game slug is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Fetch the game to get its ID and IGDB ID
    const { data: game, error: fetchError } = await supabase
      .from("games")
      .select("id, igdb_id")
      .eq("slug", slug)
      .single();

    if (fetchError || !game) {
      if (fetchError?.code === "PGRST116") {
        return NextResponse.json({ error: "Game not found" }, { status: 404 });
      }
      logger.error("Error fetching game for sync", { error: fetchError });
      return NextResponse.json({ error: "Failed to fetch game" }, { status: 500 });
    }

    // Check if game has an IGDB ID
    if (!game.igdb_id) {
      return NextResponse.json(
        { error: "Game has no IGDB ID and cannot be synchronized" },
        { status: 400 }
      );
    }

    // Fire-and-forget: Start the sync in the background (Requirement 4.3)
    // We don't await this - it runs asynchronously
    GameImportService.syncWithIGDB(game.id, game.igdb_id)
      .then((result) => {
        if (result.success) {
          logger.info(`Background sync completed for game ${slug}`);
        } else {
          // Requirement 4.4: Log error but data is preserved
          logger.error(`Background sync failed for game ${slug}`, { error: result.error });
        }
      })
      .catch((error) => {
        // Requirement 4.4: Log error but data is preserved
        logger.error(`Background sync error for game ${slug}`, { error });
      });

    // Return immediately with 202 Accepted (Requirement 4.2, 4.3)
    return NextResponse.json(
      {
        success: true,
        message: "Sync initiated",
        gameId: game.id,
        igdbId: game.igdb_id,
      },
      { status: 202 }
    );
  } catch (error) {
    logger.error("Error in game sync API", { error });
    return NextResponse.json(
      { error: "Internal server error during sync initiation" },
      { status: 500 }
    );
  }
}
