import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { FriendServerService } from "@/lib/services/friendServerService";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/players/[id]/friends/status
 * Returns the relationship status between the authenticated user and the target player.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id: playerId } = await params;

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await FriendServerService.getRelationshipStatus(user.id, playerId);

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error in friends/status GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
