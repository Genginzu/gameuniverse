import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";

/**
 * POST /api/admin/webhooks/events/link
 * Links all webhook events for a given igdb_id to a local game_id.
 * Used after manually importing a game from the webhook events list.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { igdbId, gameId } = (await request.json()) as {
      igdbId?: number;
      gameId?: string;
    };

    if (!igdbId || !gameId) {
      return NextResponse.json({ error: "igdbId and gameId required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    await supabase
      .from("igdb_webhook_events")
      .update({ game_id: gameId })
      .eq("igdb_id", igdbId)
      .is("game_id", null);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
