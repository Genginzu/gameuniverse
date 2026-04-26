import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { syncAllGameFields } from "@/lib/services/igdb-sync";
import type { TrackableField } from "@/types/admin-games";
import { logger } from "@/lib/logger";

/**
 * POST /api/games/[slug]/sync
 *
 * Triggers a background synchronization of a game with IGDB data.
 * Uses the same sync engine as the admin panel (igdb-sync) so results
 * are identical regardless of the entry point.
 *
 * Metascore is fetched from Metacritic (handled by igdb-sync metascore field).
 * Overridden fields (manually edited by admins) are preserved.
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

    if (!game.igdb_id) {
      return NextResponse.json(
        { error: "Game has no IGDB ID and cannot be synchronized" },
        { status: 400 }
      );
    }

    let overriddenFields: TrackableField[] = [];
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: overrides } = await (supabase as any)
        .from("game_field_overrides")
        .select("field_name")
        .eq("game_id", game.id);

      if (overrides && overrides.length > 0) {
        overriddenFields = overrides.map(
          (o: { field_name: string }) => o.field_name as TrackableField
        );
      }
    } catch {
      // Table may not exist yet — sync all fields
    }

    // Fire-and-forget: sync all fields (metascore fetched from Metacritic via igdb-sync)
    syncAllGameFields(supabase as never, game.id, game.igdb_id, overriddenFields)
      .then((result) => {
        if (result.success) {
          logger.info(`Background sync completed for game ${slug}`, {
            syncedFields: result.syncedFields,
          });
        } else {
          logger.error(`Background sync failed for game ${slug}`, { error: result.error });
        }
      })
      .catch((error) => {
        logger.error(`Background sync error for game ${slug}`, { error });
      });

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
