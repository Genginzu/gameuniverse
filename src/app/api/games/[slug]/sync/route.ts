import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { syncAllGameFields } from "@/lib/services/igdb-sync";
import { fetchMetacriticScore } from "@/lib/services/metacriticService";
import type { TrackableField } from "@/types/admin-games";
import { logger } from "@/lib/logger";

/**
 * POST /api/games/[slug]/sync
 *
 * Triggers a background synchronization of a game with IGDB data.
 * Uses the same sync engine as the admin panel (igdb-sync) so results
 * are identical regardless of the entry point.
 *
 * Overridden fields (manually edited by admins) are preserved.
 *
 * Returns:
 * - 202: Sync initiated (fire-and-forget)
 * - 400: Game has no IGDB ID
 * - 404: Game not found
 * - 500: Internal server error
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

    if (!game.igdb_id) {
      return NextResponse.json(
        { error: "Game has no IGDB ID and cannot be synchronized" },
        { status: 400 }
      );
    }

    // Fetch overridden fields so we don't overwrite admin edits
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

    // Fire-and-forget: use the same sync engine as the admin panel
    syncAllGameFields(supabase as never, game.id, game.igdb_id, overriddenFields)
      .then(async (result) => {
        if (result.success) {
          logger.info(`Background sync completed for game ${slug}`, {
            syncedFields: result.syncedFields,
          });
        } else {
          logger.error(`Background sync failed for game ${slug}`, { error: result.error });
        }

        // After IGDB sync, always try Metacritic for a more accurate metascore
        if (!overriddenFields.includes("metascore" as TrackableField)) {
          try {
            const metacriticScore = await fetchMetacriticScore(slug);
            if (metacriticScore !== null) {
              const freshSupabase = await createRouteHandlerClient();
              await freshSupabase
                .from("games")
                .update({ metascore: metacriticScore })
                .eq("id", game.id);
              logger.info(`Metacritic score applied for ${slug}`, { score: metacriticScore });
            }
          } catch (error) {
            logger.warn(`Metacritic check failed for ${slug}`, { error });
          }
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
