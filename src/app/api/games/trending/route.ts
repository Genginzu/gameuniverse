import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { transformGames } from "@/lib/services/gameListingHelpers";
import { logger } from "@/lib/logger";

const GAME_SELECT = `
  id, slug, igdb_id, cover_image_url, background_image_url, background_color,
  release_date, metascore, created_at, view_count, popularity_score,
  game_translations(language_code, title, description),
  game_genres(genres(genre_translations(language_code, name))),
  game_companies(role, is_primary, companies(name))
`;

const DEFAULT_LIMIT = 12;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";
    const limit = Math.min(parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10), 30);

    const supabase = await createRouteHandlerClient();

    const [mostViewed, mostPopular, bestRated, recentlyAdded] = await Promise.all([
      supabase
        .from("games")
        .select(GAME_SELECT)
        .not("view_count", "is", null)
        .gt("view_count", 0)
        .order("view_count", { ascending: false })
        .limit(limit),
      supabase
        .from("games")
        .select(GAME_SELECT)
        .not("hybrid_popularity_score", "is", null)
        .gt("hybrid_popularity_score", 0)
        .order("hybrid_popularity_score", { ascending: false })
        .limit(limit),
      supabase
        .from("games")
        .select(GAME_SELECT)
        .not("metascore", "is", null)
        .gt("metascore", 0)
        .order("metascore", { ascending: false })
        .limit(limit),
      supabase
        .from("games")
        .select(GAME_SELECT)
        .order("created_at", { ascending: false })
        .limit(limit),
    ]);

    const fields: string[] = [];

    return NextResponse.json({
      mostViewed: transformGames(mostViewed.data ?? [], locale, fields),
      mostPopular: transformGames(mostPopular.data ?? [], locale, fields),
      bestRated: transformGames(bestRated.data ?? [], locale, fields),
      recentlyAdded: transformGames(recentlyAdded.data ?? [], locale, fields),
    });
  } catch (error) {
    logger.error("Error in trending API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
