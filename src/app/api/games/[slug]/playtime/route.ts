import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { IGDBService } from "@/lib/services/igdbService";

/**
 * GET /api/games/[slug]/playtime
 *
 * Fetches and updates playtime data from IGDB for a specific game.
 * Useful for manually refreshing playtime data.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Game slug is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Fetch the game to get its IGDB ID
    const { data: game, error: fetchError } = await supabase
      .from("games")
      .select(
        "id, igdb_id, playtime_hastily, playtime_normally, playtime_completely, playtime_updated_at"
      )
      .eq("slug", slug)
      .single();

    if (fetchError || !game) {
      if (fetchError?.code === "PGRST116") {
        return NextResponse.json({ error: "Game not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to fetch game" }, { status: 500 });
    }

    if (!game.igdb_id) {
      return NextResponse.json({ error: "Game has no IGDB ID" }, { status: 400 });
    }

    // Fetch time to beat from IGDB
    const timeToBeat = await IGDBService.getTimeToBeat(game.igdb_id);

    if (!timeToBeat) {
      return NextResponse.json({
        message: "No playtime data available from IGDB for this game",
        igdbId: game.igdb_id,
        currentData: {
          hastily: game.playtime_hastily,
          normally: game.playtime_normally,
          completely: game.playtime_completely,
          lastUpdated: game.playtime_updated_at,
        },
      });
    }

    // Convert seconds to hours
    const secondsToHours = (seconds: number | null): number | null => {
      if (seconds === null || seconds === 0) return null;
      return Math.round((seconds / 3600) * 10) / 10;
    };

    const hastily = secondsToHours(timeToBeat.hastily);
    const normally = secondsToHours(timeToBeat.normally);
    const completely = secondsToHours(timeToBeat.completely);

    // Update the database
    const { error: updateError } = await supabase
      .from("games")
      .update({
        playtime_hastily: hastily,
        playtime_normally: normally,
        playtime_completely: completely,
        playtime_updated_at: new Date().toISOString(),
      })
      .eq("id", game.id);

    if (updateError) {
      console.error("Failed to update playtime:", updateError);
      return NextResponse.json({ error: "Failed to update playtime" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      igdbId: game.igdb_id,
      rawData: timeToBeat,
      convertedData: {
        hastily,
        normally,
        completely,
      },
    });
  } catch (error) {
    console.error("Error fetching playtime:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
