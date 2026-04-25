import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { FriendServerService } from "@/lib/services/friendServerService";
import { AchievementEngine } from "@/lib/services/achievementEngine";
import { logger } from "@/lib/logger";
import { CoinService } from "@/lib/services/coinService";

type RouteContext = { params: Promise<{ id: string; friendshipId: string }> };

/**
 * PATCH /api/players/[id]/friends/[friendshipId]
 * Accept a pending friend request. Only the receiver can accept.
 */
export async function PATCH(_request: NextRequest, { params }: RouteContext) {
  try {
    const { friendshipId } = await params;

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updated = await FriendServerService.acceptRequest(friendshipId, user.id);

    // Evaluate achievements for both users (non-blocking)
    try {
      await AchievementEngine.evaluate(user.id, "social");
    } catch (error) {
      console.error("Achievement evaluation failed:", error);
    }

    CoinService.rewardActivity(user.id, "friend_add", friendshipId).catch((err) =>
      logger.error("Coin reward failed", { error: err })
    );

    return NextResponse.json(updated);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("not found") || message.includes("not authorized")) {
      return NextResponse.json({ error: "Friendship not found" }, { status: 404 });
    }

    logger.error("Error in friends PATCH", { error: message });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/players/[id]/friends/[friendshipId]
 * Decline a pending request or remove an accepted friend.
 * Either the sender or receiver can delete.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { friendshipId } = await params;

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await FriendServerService.deleteRequest(friendshipId, user.id);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Error in friends DELETE", { error: message });
    return NextResponse.json({ error: "Friendship not found" }, { status: 404 });
  }
}
