import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { BULK_FIELD_TO_OVERRIDE } from "@/lib/services/bulkFieldSync";
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
 * Returns the count of IGDB-linked games missing data for each importable field,
 * excluding games where the field has been manually overridden by an admin.
 */
export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();

    // Fetch all overridden game+field pairs in one query
    const { data: overrides } = await supabase
      .from("game_field_overrides")
      .select("game_id, field_name");

    const overridesByField = new Map<string, string[]>();
    for (const o of overrides ?? []) {
      const list = overridesByField.get(o.field_name) ?? [];
      list.push(o.game_id);
      overridesByField.set(o.field_name, list);
    }

    const results: Record<string, number> = {};

    for (const [key, column] of Object.entries(IMPORTABLE_FIELDS)) {
      const overrideName = BULK_FIELD_TO_OVERRIDE[key];
      const excludedIds = overrideName ? (overridesByField.get(overrideName) ?? []) : [];

      let query = supabase
        .from("games")
        .select("id", { count: "exact", head: true })
        .not("igdb_id", "is", null)
        .is(column, null);

      if (excludedIds.length > 0) {
        query = query.not("id", "in", `(${excludedIds.join(",")})`);
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
