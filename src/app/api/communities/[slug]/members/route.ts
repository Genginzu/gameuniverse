import { NextRequest, NextResponse } from "next/server";
import { CommunityServerService } from "@/lib/services/communityServerService";
import { CommunityMembersServerService } from "@/lib/services/communityMembersServerService";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * GET /api/communities/[slug]/members — List members of a community.
 * Access follows the community's RLS visibility (public communities: anyone; private:
 * members only, enforced at the DB level by community_members RLS policies).
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;

    const access = await CommunityServerService.getCommunityAccess(slug);
    if (!access) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const members = await CommunityMembersServerService.fetchMembers(access.id);

    return NextResponse.json({ members });
  } catch (error) {
    logger.error("Error in community members GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
