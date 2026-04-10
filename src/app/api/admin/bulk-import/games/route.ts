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

/** Supabase max rows per request */
const PAGE_SIZE = 1000;

/**
 * GET /api/admin/bulk-import/games?field=cover&limit=20&offset=0
 * Returns games missing the specified field data.
 * Handles Supabase's 1000-row limit by paginating internally.
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

    // Build base query helper
    const buildQuery = () => {
      let q = supabase
        .from("games")
        .select("id, slug, igdb_id, cover_image_url, view_count, metascore", { count: "exact" })
        .not("igdb_id", "is", null);

      if (field === "metascore") {
        q = q.is("metascore", null);
      } else {
        q = q.is(column, null);
      }

      return q
        .order("view_count", { ascending: false })
        .order("metascore", { ascending: false, nullsFirst: false });
    };

    // For small limits, single query
    if (limit <= PAGE_SIZE) {
      const { data, count, error } = await buildQuery().range(offset, offset + limit - 1);

      if (error) {
        logger.error("Error fetching games for bulk import", { field, error });
        return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
      }

      const games = await enrichWithTitles(supabase, data || []);
      return NextResponse.json({ games, total: count ?? 0 });
    }

    // For large limits (e.g. "All"), paginate through Supabase's 1000-row limit
    let allData: typeof Array.prototype = [];
    let totalCount = 0;
    let currentOffset = offset;
    const maxRows = limit;

    while (allData.length < maxRows) {
      const batchSize = Math.min(PAGE_SIZE, maxRows - allData.length);
      const { data, count, error } = await buildQuery().range(
        currentOffset,
        currentOffset + batchSize - 1
      );

      if (error) {
        logger.error("Error fetching games page for bulk import", { field, error, currentOffset });
        break;
      }

      if (count !== null && totalCount === 0) totalCount = count;
      if (!data || data.length === 0) break;

      allData = allData.concat(data);
      currentOffset += data.length;

      // If we got fewer rows than requested, we've reached the end
      if (data.length < batchSize) break;
    }

    const games = await enrichWithTitles(supabase, allData);
    return NextResponse.json({ games, total: totalCount });
  } catch (error) {
    logger.error("Error in bulk import games endpoint", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Fetch EN titles for a batch of games */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function enrichWithTitles(supabase: any, data: any[]) {
  const gameIds = data.map((g: { id: string }) => g.id);
  let titles: Record<string, string> = {};

  // Fetch titles in batches of 1000 (Supabase .in() limit)
  for (let i = 0; i < gameIds.length; i += PAGE_SIZE) {
    const batch = gameIds.slice(i, i + PAGE_SIZE);
    const { data: translations } = await supabase
      .from("game_translations")
      .select("game_id, title")
      .in("game_id", batch)
      .eq("language_code", "en");

    if (translations) {
      for (const t of translations) {
        titles[t.game_id] = t.title;
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((g: any) => ({
    id: g.id,
    slug: g.slug,
    igdbId: g.igdb_id,
    title: titles[g.id] || g.slug,
    coverImage: g.cover_image_url,
    viewCount: g.view_count ?? 0,
    metascore: g.metascore ?? null,
  }));
}
