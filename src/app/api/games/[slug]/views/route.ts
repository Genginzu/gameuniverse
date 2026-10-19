import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { enforceRateLimit } from "@/lib/services/rateLimitService";
import { logger } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    // view_count drives the default listing order: limit per client IP.
    const limited = await enforceRateLimit("view", { request });
    if (limited) return limited;

    const supabase = await createRouteHandlerClient();

    // Resolve slug to game ID
    const { data: game, error: fetchError } = await supabase
      .from("games")
      .select("id")
      .eq("slug", slug)
      .single();

    if (fetchError || !game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // increment_game_view_count is service_role only (migration 20261019000002).
    const { error } = await getSupabaseAdmin().rpc("increment_game_view_count", {
      p_game_id: game.id,
    });

    if (error) {
      logger.error("Error incrementing game view count", { slug, error });
      return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in game views API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
