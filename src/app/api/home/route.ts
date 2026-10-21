import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { transformGames } from "@/lib/services/gameListingHelpers";
import { logger } from "@/lib/logger";
import {
  fetchHomeStats,
  fetchPopularCharacters,
  fetchRecentReviews,
} from "@/lib/services/homeLandingService";
import {
  HOME_GAME_SELECT,
  fetchShowcaseCharacters,
  fetchShowcaseGames,
} from "@/lib/services/homeShowcaseQueries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";

    const supabase = await createRouteHandlerClient();

    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    const [
      trending,
      upcoming,
      popularCharacters,
      recentReviews,
      showcaseGames,
      showcaseCharacters,
      stats,
    ] = await Promise.all([
      supabase
        .from("games")
        .select(HOME_GAME_SELECT)
        .not("hybrid_popularity_score", "is", null)
        .gt("hybrid_popularity_score", 0)
        .order("hybrid_popularity_score", { ascending: false })
        .limit(6),
      supabase
        .from("games")
        .select(HOME_GAME_SELECT)
        .gte("release_date", monthStart)
        .lte("release_date", monthEnd)
        .order("release_date", { ascending: true })
        .limit(12),
      fetchPopularCharacters(supabase, locale),
      fetchRecentReviews(supabase, locale),
      fetchShowcaseGames(supabase, locale),
      fetchShowcaseCharacters(supabase, locale),
      fetchHomeStats(supabase),
    ]);

    const fields: string[] = [];

    if (trending.error || upcoming.error) {
      logger.warn("Home API game query failed", {
        trendingError: trending.error?.message,
        upcomingError: upcoming.error?.message,
      });
    }

    return NextResponse.json({
      trending: transformGames(trending.data ?? [], locale, fields),
      upcoming: transformGames(upcoming.data ?? [], locale, fields),
      popularCharacters,
      recentReviews,
      showcaseGames,
      showcaseCharacters,
      stats,
    });
  } catch (error) {
    logger.error("Error in home API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
