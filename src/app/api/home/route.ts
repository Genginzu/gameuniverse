import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { transformGames } from "@/lib/services/gameListingHelpers";
import { logger } from "@/lib/logger";

const GAME_SELECT = `
  id, slug, igdb_id, cover_image_url, background_image_url, background_color,
  release_date, metascore, created_at,
  game_translations(language_code, title, description),
  game_genres(genres(genre_translations(language_code, name))),
  game_companies(role, is_primary, companies(name))
`;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";

    const supabase = await createRouteHandlerClient();

    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    const [trending, upcoming] = await Promise.all([
      supabase
        .from("games")
        .select(GAME_SELECT)
        .not("hybrid_popularity_score", "is", null)
        .gt("hybrid_popularity_score", 0)
        .order("hybrid_popularity_score", { ascending: false })
        .limit(6),
      supabase
        .from("games")
        .select(GAME_SELECT)
        .gte("release_date", monthStart)
        .lte("release_date", monthEnd)
        .order("release_date", { ascending: true })
        .limit(12),
    ]);

    const fields: string[] = [];

    return NextResponse.json({
      trending: transformGames(trending.data ?? [], locale, fields),
      upcoming: transformGames(upcoming.data ?? [], locale, fields),
    });
  } catch (error) {
    logger.error("Error in home API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
