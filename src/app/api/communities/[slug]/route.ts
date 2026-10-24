import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { defineRoute, forbidden, notFound } from "@/lib/api/route";
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
export const PATCH = defineRoute(
  { auth: "required", rateLimit: "groupUpdate", writesContent: true, body: updateCommunitySchema },
  async ({ user, params, body }) => {
    const { slug } = params;

    const access = await CommunityServerService.getCommunityAccess(slug);
    if (!access) throw notFound("Community not found");

    const role = await CommunityMembersServerService.getMemberRole(access.id, user.id);
    if (role !== "owner" && role !== "moderator") throw forbidden("Forbidden");

    await CommunityServerService.updateCommunity(slug, body);
    const updated = await CommunityServerService.fetchCommunityBySlug(slug, user.id);

    return NextResponse.json({ community: updated });
  }
);

/**
 * DELETE /api/communities/[slug] — Delete a community.
 * Authentication required. Only the owner can delete.
 */
export const DELETE = defineRoute({ auth: "required" }, async ({ user, params }) => {
  const { slug } = params;

  const access = await CommunityServerService.getCommunityAccess(slug);
  if (!access) throw notFound("Community not found");

  if (access.ownerId !== user.id) throw forbidden("Forbidden");

  await CommunityServerService.deleteCommunity(slug);

  return new NextResponse(null, { status: 204 });
});
