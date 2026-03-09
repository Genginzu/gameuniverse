import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { FriendServerService } from "@/lib/services/friendServerService";
import { parsePaginationParams } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

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
export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id: playerId } = await params;

    // Auth required
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Cannot send a request to yourself
    if (user.id === playerId) {
      return NextResponse.json(
        { error: "Cannot send friend request to yourself" },
        { status: 400 }
      );
    }

    // Target player must exist
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", playerId)
      .maybeSingle();

    if (!targetProfile) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // No existing relationship allowed
    const relationship = await FriendServerService.getRelationshipStatus(user.id, playerId);
    if (relationship.status !== "none") {
      return NextResponse.json({ error: "Friendship already exists" }, { status: 409 });
    }

    const friendship = await FriendServerService.sendRequest(user.id, playerId);

    return NextResponse.json(friendship, { status: 201 });
  } catch (error) {
    logger.error("Error in friends POST", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
