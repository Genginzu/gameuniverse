import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { FriendServerService } from "@/lib/services/friendServerService";
import { friendRequested } from "@/lib/services/notifications";
import { AchievementEngine } from "@/lib/services/achievementEngine";
import { parsePaginationParams } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { conflict, defineRoute, notFound, validationError } from "@/lib/api/route";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/players/[id]/friends — List accepted friends with pagination.
 * Public for accepted friends. If the requester is the profile owner,
 * pending received requests are included in the response.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: playerId } = await params;
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePaginationParams(searchParams);

    const friendsResponse = await FriendServerService.getFriends(playerId, page, limit);

    // Determine if the requester is the profile owner
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isOwner = user?.id === playerId;

    if (isOwner) {
      const pendingRequests = await FriendServerService.getPendingRequests(playerId);
      friendsResponse.pendingRequests = pendingRequests;
    }

    return NextResponse.json(friendsResponse);
  } catch (error) {
    logger.error("Error in friends GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/players/[id]/friends — Send a friend request.
 * The authenticated user is the sender; [id] is the receiver.
 * Validates: auth, self-request, target exists, no duplicate relationship.
 */
export const POST = defineRoute(
  { auth: "required", rateLimit: "friendRequest" },
  async ({ user, params }) => {
    const { id: playerId } = params;

    // Cannot send a request to yourself
    if (user.id === playerId) {
      throw validationError(undefined, "Cannot send friend request to yourself");
    }

    // Target player must exist
    const supabase = await createRouteHandlerClient();
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", playerId)
      .maybeSingle();

    if (!targetProfile) throw notFound("Player not found");

    // No existing relationship allowed
    const relationship = await FriendServerService.getRelationshipStatus(user.id, playerId);
    if (relationship.status !== "none") throw conflict("Friendship already exists");

    const friendship = await FriendServerService.sendRequest(user.id, playerId);

    await friendRequested({
      friendshipId: friendship.id,
      requesterId: user.id,
      receiverId: playerId,
    });

    // Evaluate achievements (non-blocking)
    try {
      await AchievementEngine.evaluate(user.id, "social");
    } catch (error) {
      console.error("Achievement evaluation failed:", error);
    }

    return NextResponse.json(friendship, { status: 201 });
  }
);
