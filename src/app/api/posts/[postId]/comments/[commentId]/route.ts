import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { PostCommentServerService } from "@/lib/services/postCommentServerService";
import { PlayerPostsServerService } from "@/lib/services/playerPostsServerService";
import { logger } from "@/lib/logger";

/**
 * DELETE /api/posts/[postId]/comments/[commentId] — Delete a comment.
 * Allowed for the comment author or the post owner.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const { postId, commentId } = await params;

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const post = await PlayerPostsServerService.getPost(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await PostCommentServerService.deleteComment(commentId, user.id, post.playerId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "Comment not found") {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }
    if (message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    logger.error("Error in comment DELETE", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
