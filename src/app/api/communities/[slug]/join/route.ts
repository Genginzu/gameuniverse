import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { CommunityServerService } from "@/lib/services/communityServerService";
import { CommunityMembersServerService } from "@/lib/services/communityMembersServerService";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * POST /api/communities/[slug]/join — Join a community as a regular member.
 * Authentication required.
 */
export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;

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

    if (access.visibility === "private") {
      return NextResponse.json(
        { error: "Cannot join a private community directly" },
        { status: 403 }
      );
    }

    const existingRole = await CommunityMembersServerService.getMemberRole(access.id, user.id);
    if (existingRole !== null) {
      return NextResponse.json({ error: "Already a member" }, { status: 409 });
    }

    await CommunityMembersServerService.joinCommunity(access.id, user.id);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    logger.error("Error in community join POST", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/communities/[slug]/join — Leave a community.
 * Authentication required. The owner cannot leave (must delete the community instead).
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;

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

    if (access.ownerId === user.id) {
      return NextResponse.json(
        { error: "The owner cannot leave the community. Delete it instead." },
        { status: 403 }
      );
    }

    await CommunityMembersServerService.leaveCommunity(access.id, user.id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error("Error in community join DELETE", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
