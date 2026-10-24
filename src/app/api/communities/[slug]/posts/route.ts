import { NextRequest, NextResponse } from "next/server";
import { CommunityServerService } from "@/lib/services/communityServerService";
import { CommunityMembersServerService } from "@/lib/services/communityMembersServerService";
import { CommunityPostsServerService } from "@/lib/services/communityPostsServerService";
import { createCommunityPostSchema } from "@/lib/validations/community";
import { logger } from "@/lib/logger";
import { defineRoute, forbidden, notFound } from "@/lib/api/route";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * GET /api/communities/[slug]/posts — List posts of a community's feed, newest first.
 * Access follows the community's RLS visibility (public: anyone; private: members only).
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;

    const access = await CommunityServerService.getCommunityAccess(slug);
    if (!access) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const posts = await CommunityPostsServerService.fetchPosts(access.id);

    return NextResponse.json({ posts });
  } catch (error) {
    logger.error("Error in community posts GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/communities/[slug]/posts — Create a post in a community's feed.
 * Authentication required. Only members can post.
 */
export const POST = defineRoute(
  { auth: "required", rateLimit: "post", writesContent: true, body: createCommunityPostSchema },
  async ({ user, params, body }) => {
    const { slug } = params;

    const access = await CommunityServerService.getCommunityAccess(slug);
    if (!access) throw notFound("Community not found");

    const role = await CommunityMembersServerService.getMemberRole(access.id, user.id);
    if (role === null) throw forbidden("Only members can post in this community");

    const post = await CommunityPostsServerService.createPost(access.id, user.id, body.content);

    return NextResponse.json({ post }, { status: 201 });
  }
);
