import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { CommunityServerService } from "@/lib/services/communityServerService";
import { CommunityMembersServerService } from "@/lib/services/communityMembersServerService";
import { updateCommunitySchema } from "@/lib/validations/community";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * GET /api/communities/[slug] — Community detail.
 * Returns 404 if the community is private and the viewer is not a member.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const community = await CommunityServerService.fetchCommunityBySlug(slug, user?.id);

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    if (community.visibility === "private" && community.viewerRole === null) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    return NextResponse.json({ community });
  } catch (error) {
    logger.error("Error in community GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/communities/[slug] — Update a community.
 * Authentication required. Only owner/moderator members can update.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
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

    const role = await CommunityMembersServerService.getMemberRole(access.id, user.id);
    if (role !== "owner" && role !== "moderator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateCommunitySchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
    }

    await CommunityServerService.updateCommunity(slug, parsed.data);
    const updated = await CommunityServerService.fetchCommunityBySlug(slug, user.id);

    return NextResponse.json({ community: updated });
  } catch (error) {
    logger.error("Error in community PATCH", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/communities/[slug] — Delete a community.
 * Authentication required. Only the owner can delete.
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

    if (access.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await CommunityServerService.deleteCommunity(slug);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error("Error in community DELETE", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
