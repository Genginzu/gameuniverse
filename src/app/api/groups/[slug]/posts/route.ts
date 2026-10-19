import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { GroupServerService } from "@/lib/services/groupServerService";
import { GroupMembersServerService } from "@/lib/services/groupMembersServerService";
import { GroupPostsServerService } from "@/lib/services/groupPostsServerService";
import { createGroupPostSchema } from "@/lib/validations/group";
import { logger } from "@/lib/logger";
import { enforceRateLimit } from "@/lib/services/rateLimitService";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * GET /api/groups/[slug]/posts â€” List posts of a group's feed, newest first.
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
 * POST /api/groups/[slug]/posts â€” Create a post in a group's feed.
 * Authentication required. Only members can post.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
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

    const limited = await enforceRateLimit("post", { userId: user.id });
    if (limited) return limited;

    const access = await GroupServerService.getGroupAccess(slug);
    if (!access) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const role = await GroupMembersServerService.getMemberRole(access.id, user.id);
    if (role === null) {
      return NextResponse.json({ error: "Only members can post in this group" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createGroupPostSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
    }

    const post = await GroupPostsServerService.createPost(access.id, user.id, parsed.data.content);

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    logger.error("Error in group posts POST", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
