import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

// GET /api/library/stats - Get user's library statistics
export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use the database function to get stats
    const { data: stats, error } = await supabase.rpc("get_user_library_stats", {
      user_uuid: user.id,
    });

    if (error) {
      // PGRST205 = table/function not found (migration not applied yet)
      if (error.code === "PGRST205" || error.code === "42883") {
        logger.warn("user_library table/function not found - migration not applied yet");
        return NextResponse.json({
          totalGames: 0,
          ownedGames: 0,
          completedGames: 0,
          totalPlayTime: 0,
          averageRating: null,
        });
      }
      logger.error("Error fetching library stats", { error });
      return NextResponse.json({ error: "Failed to fetch library statistics" }, { status: 500 });
    }

    // The function returns an array with one object
    const statsData = stats?.[0] || {
      total_games: 0,
      owned_games: 0,
      completed_games: 0,
      total_play_time: 0,
      average_rating: null,
    };

    return NextResponse.json({
      totalGames: statsData.total_games,
      ownedGames: statsData.owned_games,
      completedGames: statsData.completed_games,
      totalPlayTime: statsData.total_play_time,
      averageRating: statsData.average_rating,
    });
  } catch (error) {
    logger.error("Error in library stats API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
