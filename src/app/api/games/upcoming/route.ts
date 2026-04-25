import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { transformGames } from "@/lib/services/gameListingHelpers";
import { parsePaginationParams, calculateOffset } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

const GAME_SELECT = `
  id, slug, igdb_id, cover_image_url, background_image_url, background_color,
  release_date, metascore, created_at,
  game_translations(language_code, title, description),
  game_genres(genres(genre_translations(language_code, name))),
  game_companies(role, is_primary, companies(name)),
  game_platforms(platforms(slug, platform_translations(language_code, name)))
`;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";
    const { page, limit } = parsePaginationParams(searchParams);
    const offset = calculateOffset(page, limit);
    const genre = searchParams.get("genre") || "";
    const platform = searchParams.get("platform") || "";
    const month = searchParams.get("month") || ""; // YYYY-MM format

    const supabase = await createRouteHandlerClient();

    let query = supabase
      .from("games")
      .select(GAME_SELECT, { count: "exact" })
      .gt("release_date", new Date().toISOString().split("T")[0])
      .not("release_date", "is", null);

    // Month filter (e.g. "2026-05")
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const start = `${month}-01`;
      const endDate = new Date(parseInt(month.split("-")[0]), parseInt(month.split("-")[1]), 0);
      const end = endDate.toISOString().split("T")[0];
      query = query.gte("release_date", start).lte("release_date", end);
    }

    // Genre filter by slug
    if (genre) {
      const { data: genreIds } = await supabase.from("genres").select("id").eq("slug", genre);
      if (genreIds && genreIds.length > 0) {
        const { data: gameIds } = await supabase
          .from("game_genres")
          .select("game_id")
          .in(
            "genre_id",
            genreIds.map((g) => g.id)
          );
        if (gameIds && gameIds.length > 0) {
          query = query.in(
            "id",
            gameIds.map((g) => g.game_id)
          );
        } else {
          return NextResponse.json({
            games: [],
            pagination: { currentPage: page, totalPages: 0, totalCount: 0 },
          });
        }
      }
    }

    // Platform filter by slug
    if (platform) {
      const { data: platformIds } = await supabase
        .from("platforms")
        .select("id")
        .eq("slug", platform);
      if (platformIds && platformIds.length > 0) {
        const { data: gameIds } = await supabase
          .from("game_platforms")
          .select("game_id")
          .in(
            "platform_id",
            platformIds.map((p) => p.id)
          );
        if (gameIds && gameIds.length > 0) {
          query = query.in(
            "id",
            gameIds.map((g) => g.game_id)
          );
        } else {
          return NextResponse.json({
            games: [],
            pagination: { currentPage: page, totalPages: 0, totalCount: 0 },
          });
        }
      }
    }

    const { data, count, error } = await query
      .order("release_date", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error("Error fetching upcoming games", { error });
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    const totalCount = count ?? 0;

    return NextResponse.json({
      games: transformGames(data ?? [], locale, []),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      },
    });
  } catch (error) {
    logger.error("Error in upcoming API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
