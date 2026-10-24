import { NextRequest, NextResponse } from "next/server";
import { GroupServerService } from "@/lib/services/groupServerService";
import { GroupMembersServerService } from "@/lib/services/groupMembersServerService";
import { GroupPostsServerService } from "@/lib/services/groupPostsServerService";
import { createGroupPostSchema } from "@/lib/validations/group";
import { logger } from "@/lib/logger";
import { defineRoute, forbidden, notFound } from "@/lib/api/route";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * GET /api/groups/[slug]/posts — List posts of a group's feed, newest first.
 * Access follows the group's RLS visibility (public groups: anyone; private: members only).
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;

    const access = await GroupServerService.getGroupAccess(slug);
    if (!access) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const posts = await GroupPostsServerService.fetchPosts(access.id);

    return NextResponse.json({ posts });
  } catch (error) {
    logger.error("Error in group posts GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/groups/[slug]/posts — Create a post in a group's feed.
 * Authentication required. Only members can post.
 */
export const POST = defineRoute(
  { auth: "required", rateLimit: "post", writesContent: true, body: createGroupPostSchema },
  async ({ user, params, body }) => {
    const { slug } = params;

    const access = await GroupServerService.getGroupAccess(slug);
    if (!access) throw notFound("Group not found");

    const role = await GroupMembersServerService.getMemberRole(access.id, user.id);
    if (role === null) throw forbidden("Only members can post in this group");

    const post = await GroupPostsServerService.createPost(access.id, user.id, body.content);

    return NextResponse.json({ post }, { status: 201 });
  }
);
