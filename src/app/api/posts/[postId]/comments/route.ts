import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { PostCommentServerService } from "@/lib/services/postCommentServerService";
import { PlayerPostsServerService } from "@/lib/services/playerPostsServerService";
import { logger } from "@/lib/logger";

/**
 * GET /api/posts/[postId]/comments — Fetch comments for a post.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    const { comments, totalCount } = await PostCommentServerService.getComments(postId);

    return NextResponse.json({ comments, totalCount });
  } catch (error) {
    logger.error("Error in post comments GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/posts/[postId]/comments — Create a comment on a post.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { postId } = await params;

    const body = await request.json().catch(() => null);
    const content = typeof body?.content === "string" ? body.content : "";

    const post = await PlayerPostsServerService.getPost(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const comment = await PostCommentServerService.createComment(postId, user.id, content);

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Content must be between 1 and 500 characters"
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    logger.error("Error in post comments POST", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
