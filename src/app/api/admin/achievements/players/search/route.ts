import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { defineRoute } from "@/lib/api/route";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/achievements/players/search?q=<term>
 * Search profiles by username (ilike) or by exact UUID id.
 * Returns up to 20 results. Empty query returns empty array.
 */
export const GET = defineRoute({ auth: "admin" }, async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ players: [] });
  }

  const supabase = await createRouteHandlerClient();

  // UUID v4 pattern — if the query is an exact UUID, search by id
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query);

  let rows;

  if (isUuid) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .eq("id", query)
      .limit(1);

    if (error) {
      logger.error("Error searching player by UUID", { error });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    rows = data;
  } else {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .ilike("username", `%${query}%`)
      .limit(20);

    if (error) {
      logger.error("Error searching players by username", { error });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    rows = data;
  }

  const players = (rows ?? []).map((row) => ({
    id: row.id,
    username: row.username,
    avatarUrl: row.avatar_url,
  }));

  return NextResponse.json({ players });
});
