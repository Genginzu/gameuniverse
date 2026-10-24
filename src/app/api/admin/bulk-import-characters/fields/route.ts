import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { defineRoute } from "@/lib/api/route";

const IMPORTABLE_FIELDS: Record<string, string> = {
  image: "main_image",
  background: "background_image",
};

/**
 * GET /api/admin/bulk-import-characters/fields
 * Returns the count of IGDB-linked characters missing data for each field.
 */
export const GET = defineRoute({ auth: "admin" }, async () => {
  const supabase = await createRouteHandlerClient();
  const results: Record<string, number> = {};

  for (const [key, column] of Object.entries(IMPORTABLE_FIELDS)) {
    const { count, error } = await supabase
      .from("characters")
      .select("id", { count: "exact", head: true })
      .not("igdb_id", "is", null)
      .is(column, null);

    if (error) {
      logger.warn(`Bulk import character count failed for ${key}`, { error });
    }
    results[key] = count ?? 0;
  }

  return NextResponse.json(results);
});
