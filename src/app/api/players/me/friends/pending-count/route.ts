import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type { PendingCountResponse } from "@/types/friendship";

/**
 * GET /api/players/me/friends/pending-count
 * Returns the number of pending friend requests received by the authenticated player.
 */
export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { count, error } = await supabase
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("status", "pending");

    if (error) {
      logger.error("Error fetching pending friend request count", { error });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    const response: PendingCountResponse = { count: count ?? 0 };
    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error in pending-count GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
