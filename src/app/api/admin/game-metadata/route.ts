import { NextResponse } from "next/server";
import { z } from "zod";

import { defineRoute } from "@/lib/api/route";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { untypedTable } from "@/lib/utils/untypedTable";

export const dynamic = "force-dynamic";

/** Reference tables too large to list: searched by name. */
const SEARCHABLE_TABLES = ["franchises", "series", "game_engines", "keywords"] as const;
const LISTED_TABLES = ["themes", "game_modes", "player_perspectives"] as const;
const SEARCH_LIMIT = 20;

const querySchema = z.object({
  kind: z.enum(SEARCHABLE_TABLES).optional(),
  q: z.string().trim().max(100).optional(),
});

interface ReferenceRow {
  id: string;
  igdb_id: number | null;
  name: string | null;
}

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

/**
 * GET /api/admin/game-metadata — themes, game modes and perspectives of the
 * admin game form. `?kind=franchises&q=witch` searches a large reference
 * table (franchises, series, game_engines, keywords) by name.
 */
export const GET = defineRoute({ auth: "admin", query: querySchema }, async ({ query }) => {
  const supabase = await createRouteHandlerClient();

  if (query.kind) {
    if (!query.q) return NextResponse.json({ items: [] });
    const { data, error } = await untypedTable(supabase, query.kind)
      .select("id, igdb_id, name")
      .ilike("name", `%${escapeLike(query.q)}%`)
      .order("name")
      .limit(SEARCH_LIMIT);
    if (error) return NextResponse.json({ error: "Failed to search metadata" }, { status: 500 });
    return NextResponse.json({ items: (data ?? []) as ReferenceRow[] });
  }

  const results = await Promise.all(
    LISTED_TABLES.map((table) => untypedTable(supabase, table).select("id, igdb_id, name").order("name"))
  );
  if (results.some((result) => result.error)) {
    return NextResponse.json({ error: "Failed to fetch metadata" }, { status: 500 });
  }
  return NextResponse.json(
    Object.fromEntries(LISTED_TABLES.map((table, index) => [table, results[index].data ?? []]))
  );
});
