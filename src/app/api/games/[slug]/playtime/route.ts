import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { IGDBService } from "@/lib/services/igdbService";
import { GamePlaytime } from "@/types/game";

/**
 * GET /api/games/[slug]/playtime
 *
 * Fetches playtime data for a game from IGDB.
 * Caches results in the database to avoid repeated API calls.
 *
 * Returns:
 * - 200: Playtime data
 * - 404: Game not found
 * - 500: Internal server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<GamePlaytime | { error: string }>> {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Game slug is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Fetch the game to get its IGDB ID
    const { data: game, error: fetchError } = await supabase
      .from("games")
      .select("id, igdb_id")
      .eq("slug", slug)
      .single();

    if (fetchError || !game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (!game.igdb_id) {
      return NextResponse.json({
        main: null,
        mainExtra: null,
        completionist: null,
        allStyles: null,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Fetch playtime from IGDB
    const timeToBeat = await IGDBService.getTimeToBeat(game.igdb_id);

    if (!timeToBeat) {
      return NextResponse.json({
        main: null,
        mainExtra: null,
        completionist: null,
        allStyles: null,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Convert seconds to hours
    const secondsToHours = (seconds: number | null): number | null => {
      if (seconds === null || seconds === 0) return null;
      return Math.round((seconds / 3600) * 10) / 10;
    };

    const main = secondsToHours(timeToBeat.hastily);
    const mainExtra = secondsToHours(timeToBeat.normally);
    const completionist = secondsToHours(timeToBeat.completely);

    // Calculate average
    const times = [main, mainExtra, completionist].filter((t): t is number => t !== null);
    const allStyles =
      times.length > 0
        ? Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10
        : null;

    const playtime: GamePlaytime = {
      main,
      mainExtra,
      completionist,
      allStyles,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(playtime);
  } catch (error) {
    console.error("Error in playtime API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
