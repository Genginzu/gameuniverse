import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { BULK_FIELD_TO_OVERRIDE } from "@/lib/services/bulkFieldSync";
import { logger } from "@/lib/logger";

const IMPORTABLE_FIELDS: Record<string, string> = {
  cover: "cover_image_url",
  background: "background_image_url",
  playtime: "playtime_normally",
  metascore: "metascore",
  releaseDate: "release_date",
  popularity: "igdb_pop_updated_at",
};

/**
 * GET /api/admin/bulk-import/games?field=cover&limit=20&offset=0
 * Returns games missing the specified field data (max 1000 per request),
 * excluding games where the field has been manually overridden by an admin.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const field = searchParams.get("field");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 1000);
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

    // Fetch overridden game IDs for this field
    const overrideName = BULK_FIELD_TO_OVERRIDE[field];
    let excludedIds: string[] = [];
    if (overrideName) {
      const { data: overrides } = await supabase
        .from("game_field_overrides")
        .select("game_id")
        .eq("field_name", overrideName);
      excludedIds = (overrides ?? []).map((o) => o.game_id);
    }

    let query = supabase
      .from("games")
      .select("id, slug, igdb_id, cover_image_url, view_count, metascore", { count: "exact" })
      .not("igdb_id", "is", null)
      .is(column, null);

    if (excludedIds.length > 0) {
      query = query.not("id", "in", `(${excludedIds.join(",")})`);
    }

    const { data, count, error } = await query
      .order("view_count", { ascending: false })
      .order("metascore", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error("Error fetching games for bulk import", { field, error });
      return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
    }

    // Fetch EN titles
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
