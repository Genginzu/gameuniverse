import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import {
  BULK_FIELD_TO_OVERRIDE,
  BULK_IMPORTABLE_COLUMNS,
  isBulkFieldAlias,
} from "@/lib/services/igdb-fields/registry";
import { logger } from "@/lib/logger";
import { defineRoute } from "@/lib/api/route";

/**
 * GET /api/admin/bulk-import/fields
 * Returns the count of IGDB-linked games missing data for each importable field,
 * excluding games where the field has been manually overridden by an admin.
 */
export const GET = defineRoute({ auth: "admin" }, async () => {
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

  for (const key of Object.keys(BULK_IMPORTABLE_COLUMNS).filter(isBulkFieldAlias)) {
    const column = BULK_IMPORTABLE_COLUMNS[key];
    const excludedIds = overridesByField.get(BULK_FIELD_TO_OVERRIDE[key]) ?? [];

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
});
