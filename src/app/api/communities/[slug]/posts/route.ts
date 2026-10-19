import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { CommunityServerService } from "@/lib/services/communityServerService";
import { CommunityMembersServerService } from "@/lib/services/communityMembersServerService";
import { CommunityPostsServerService } from "@/lib/services/communityPostsServerService";
import { createCommunityPostSchema } from "@/lib/validations/community";
import { logger } from "@/lib/logger";
import { enforceRateLimit } from "@/lib/services/rateLimitService";

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

    const access = await CommunityServerService.getCommunityAccess(slug);
    if (!access) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const role = await CommunityMembersServerService.getMemberRole(access.id, user.id);
    if (role === null) {
      return NextResponse.json(
        { error: "Only members can post in this community" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createCommunityPostSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
    }

    const post = await CommunityPostsServerService.createPost(
      access.id,
      user.id,
      parsed.data.content
    );

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    logger.error("Error in community posts POST", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
