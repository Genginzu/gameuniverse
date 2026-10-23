import { NextResponse } from "next/server";
import { FriendServerService } from "@/lib/services/friendServerService";
import { friendAccepted } from "@/lib/services/notifications";
import { rewardActivity } from "@/lib/services/activityRewards";
import { logger } from "@/lib/logger";
import { defineRoute, notFound } from "@/lib/api/route";

/**
 * PATCH /api/players/[id]/friends/[friendshipId]
 * Accept a pending friend request. Only the receiver can accept.
 */
export const PATCH = defineRoute({ auth: "required" }, async ({ user, params }) => {
  const { friendshipId } = params;

  try {
    const updated = await FriendServerService.acceptRequest(friendshipId, user.id);

    if (updated.sender_id) {
      await friendAccepted({
        friendshipId,
        accepterId: user.id,
        requesterId: updated.sender_id,
      });

      await rewardActivity({
        kind: "friendship_accepted",
        accepterId: user.id,
        requesterId: updated.sender_id,
      });
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("not found") || message.includes("not authorized")) {
      throw notFound("Friendship not found");
    }
    throw error;
  }
});

/**
 * DELETE /api/players/[id]/friends/[friendshipId]
 * Decline a pending request or remove an accepted friend.
 * Either the sender or receiver can delete.
 */
export const DELETE = defineRoute({ auth: "required" }, async ({ user, params }) => {
  try {
    const result = await FriendServerService.deleteRequest(params.friendshipId, user.id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Error in friends DELETE", { error: message });
    throw notFound("Friendship not found");
  }
});
