import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { CommunityServerService } from "@/lib/services/communityServerService";
import { CommunityMembersServerService } from "@/lib/services/communityMembersServerService";
import { CommunityPostsServerService } from "@/lib/services/communityPostsServerService";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ slug: string; postId: string }> };

/**
 * DELETE /api/communities/[slug]/posts/[postId] — Delete a post.
 * Authentication required. The author can delete their own post; owner/moderator can moderate.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { slug, postId } = await params;

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

    const postAccess = await CommunityPostsServerService.getPostAccess(postId);
    if (!postAccess || postAccess.communityId !== access.id) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const isAuthor = postAccess.authorId === user.id;
    if (!isAuthor) {
      const role = await CommunityMembersServerService.getMemberRole(access.id, user.id);
      if (role !== "owner" && role !== "moderator") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await CommunityPostsServerService.deletePost(postId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error("Error in community post DELETE", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
