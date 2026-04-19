import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

/**
 * Importable fields: column on the `games` table where NULL means missing.
 */
const IMPORTABLE_FIELDS: Record<string, string> = {
  cover: "cover_image_url",
  background: "background_image_url",
  playtime: "playtime_normally",
  metascore: "metascore",
  releaseDate: "release_date",
  popularity: "igdb_pop_updated_at",
};

/**
 * GET /api/admin/bulk-import/fields
 * Returns the count of IGDB-linked games missing data for each importable field.
 */
export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();
    const results: Record<string, number> = {};

    for (const [key, column] of Object.entries(IMPORTABLE_FIELDS)) {
      let query = supabase
        .from("games")
        .select("id", { count: "exact", head: true })
        .not("igdb_id", "is", null)
        .is(column, null);

      // For metascore, only count NULL (exclude -1 sentinel = already checked)
      if (key === "metascore") {
        query = supabase
          .from("games")
          .select("id", { count: "exact", head: true })
          .not("igdb_id", "is", null)
          .is("metascore", null);
      }

      const { count, error } = await query;

      if (error) {
        logger.warn(`Bulk import count failed for ${key}`, { error });
      }
      results[key] = count ?? 0;
    }

    return NextResponse.json(results);
  } catch (error) {
    logger.error("Error fetching bulk import field counts", { error });
    return NextResponse.json({ error: "Failed to fetch field counts" }, { status: 500 });
  }
}
