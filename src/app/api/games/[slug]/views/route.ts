import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

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

    // Increment view count atomically via RPC
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("increment_game_view_count", {
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
