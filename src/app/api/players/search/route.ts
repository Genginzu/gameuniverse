import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

const MAX_RESULTS = 6;

/**
 * GET /api/players/search?q=xxx
 * Lightweight player search for mention autocomplete.
 * Returns id, username, avatar_url for matching profiles.
 */
export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q")?.trim() || "";

    if (query.length < 2) {
      return NextResponse.json({ players: [] });
    }

    const supabase = await createRouteHandlerClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .ilike("username", `%${query}%`)
      .limit(MAX_RESULTS);

    if (error) {
      logger.error("Player search failed", { error: error.message });
      return NextResponse.json({ players: [] });
    }

    const players = (data ?? []).map((p) => ({
      id: p.id,
      username: p.username,
      avatarUrl: p.avatar_url,
    }));

    return NextResponse.json({ players });
  } catch (error) {
    logger.error("Error in player search", { error });
    return NextResponse.json({ players: [] });
  }
}
