import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

const IMPORTABLE_FIELDS: Record<string, string> = {
  cover: "cover_image_url",
  background: "background_image_url",
  playtime: "playtime_normally",
  metascore: "metascore",
  releaseDate: "release_date",
};

/**
 * GET /api/admin/bulk-import/games?field=cover&limit=20&offset=0
 * Returns games missing the specified field data.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const field = searchParams.get("field");
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  if (!field || !IMPORTABLE_FIELDS[field]) {
    return NextResponse.json(
      { error: "Invalid field. Valid: " + Object.keys(IMPORTABLE_FIELDS).join(", ") },
      { status: 400 }
    );
  }

  try {
    const supabase = await createRouteHandlerClient();
    const column = IMPORTABLE_FIELDS[field];

    let query = supabase
      .from("games")
      .select("id, slug, igdb_id, cover_image_url, view_count, metascore", { count: "exact" })
      .not("igdb_id", "is", null);

    // For metascore, only show NULL (not yet checked), exclude -1 (already checked, no score)
    if (field === "metascore") {
      query = query.is("metascore", null);
    } else {
      query = query.is(column, null);
    }

    const { data, count, error } = await query
      .order("view_count", { ascending: false })
      .order("metascore", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error("Error fetching games for bulk import", { field, error });
      return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
    }

    // Fetch EN title for each game
    const gameIds = (data || []).map((g) => g.id);
    let titles: Record<string, string> = {};

    if (gameIds.length > 0) {
      const { data: translations } = await supabase
        .from("game_translations")
        .select("game_id, title")
        .in("game_id", gameIds)
        .eq("language_code", "en");

      if (translations) {
        titles = Object.fromEntries(translations.map((t) => [t.game_id, t.title]));
      }
    }

    const games = (data || []).map((g) => ({
      id: g.id,
      slug: g.slug,
      igdbId: g.igdb_id,
      title: titles[g.id] || g.slug,
      coverImage: g.cover_image_url,
      viewCount: g.view_count ?? 0,
      metascore: g.metascore ?? null,
    }));

    return NextResponse.json({ games, total: count ?? 0 });
  } catch (error) {
    logger.error("Error in bulk import games endpoint", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
