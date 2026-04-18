import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

const IMPORTABLE_FIELDS: Record<string, string> = {
  image: "main_image",
  background: "background_image",
};

/**
 * GET /api/admin/bulk-import-characters/characters?field=image&limit=20&offset=0
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

    const { data, count, error } = await supabase
      .from("characters")
      .select("id, slug, igdb_id, main_image, view_count", { count: "exact" })
      .not("igdb_id", "is", null)
      .is(column, null)
      .order("view_count", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error("Error fetching characters for bulk import", { field, error });
      return NextResponse.json({ error: "Failed to fetch characters" }, { status: 500 });
    }

    // Fetch EN names
    const charIds = (data || []).map((c) => c.id);
    let names: Record<string, string> = {};

    if (charIds.length > 0) {
      const { data: translations } = await supabase
        .from("character_translations")
        .select("character_id, name")
        .in("character_id", charIds)
        .eq("language_code", "en");

      if (translations) {
        names = Object.fromEntries(translations.map((t) => [t.character_id, t.name]));
      }
    }

    const characters = (data || []).map((c) => ({
      id: c.id,
      slug: c.slug,
      igdbId: c.igdb_id,
      title: names[c.id] || c.slug,
      coverImage: c.main_image,
      viewCount: c.view_count ?? 0,
      metascore: null,
    }));

    return NextResponse.json({ games: characters, total: count ?? 0 });
  } catch (error) {
    logger.error("Error in character bulk import endpoint", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
