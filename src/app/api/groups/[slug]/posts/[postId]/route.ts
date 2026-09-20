import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { GroupServerService } from "@/lib/services/groupServerService";
import { GroupMembersServerService } from "@/lib/services/groupMembersServerService";
import { GroupPostsServerService } from "@/lib/services/groupPostsServerService";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ slug: string; postId: string }> };

/**
 * DELETE /api/groups/[slug]/posts/[postId] — Delete a post.
 * Authentication required. The author can delete their own post; owner/admin can moderate.
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

    const access = await GroupServerService.getGroupAccess(slug);
    if (!access) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const postAccess = await GroupPostsServerService.getPostAccess(postId);
    if (!postAccess || postAccess.groupId !== access.id) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const isAuthor = postAccess.authorId === user.id;
    if (!isAuthor) {
      const role = await GroupMembersServerService.getMemberRole(access.id, user.id);
      if (role !== "owner" && role !== "moderator") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await GroupPostsServerService.deletePost(postId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error("Error in group post DELETE", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
