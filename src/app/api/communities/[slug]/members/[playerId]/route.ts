import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { CommunityServerService } from "@/lib/services/communityServerService";
import { CommunityMembersServerService } from "@/lib/services/communityMembersServerService";
import { updateCommunityMemberSchema } from "@/lib/validations/community";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ slug: string; playerId: string }> };

/**
 * PATCH /api/communities/[slug]/members/[playerId] — Update a member's role.
 * Authentication required. Only owner/moderator can change roles. The owner role
 * cannot be reassigned through this endpoint.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { slug, playerId } = await params;

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const access = await CommunityServerService.getCommunityAccess(slug);
    if (!access) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const requesterRole = await CommunityMembersServerService.getMemberRole(access.id, user.id);
    if (requesterRole !== "owner" && requesterRole !== "moderator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (playerId === access.ownerId) {
      return NextResponse.json({ error: "Cannot change the owner's role" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateCommunityMemberSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
    }

    await CommunityMembersServerService.updateMemberRole(access.id, playerId, parsed.data.role);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in community member PATCH", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/communities/[slug]/members/[playerId] — Remove a member from a community.
 * Authentication required. Members can remove themselves; owner/moderator can remove others.
 * The owner cannot be removed.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { slug, playerId } = await params;

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const access = await CommunityServerService.getCommunityAccess(slug);
    if (!access) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    if (playerId === access.ownerId) {
      return NextResponse.json({ error: "Cannot remove the owner" }, { status: 403 });
    }

    const isSelf = playerId === user.id;
    if (!isSelf) {
      const requesterRole = await CommunityMembersServerService.getMemberRole(access.id, user.id);
      if (requesterRole !== "owner" && requesterRole !== "moderator") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await CommunityMembersServerService.leaveCommunity(access.id, playerId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error("Error in community member DELETE", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
