import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { defineRoute, notFound, validationError } from "@/lib/api/route";
import { PostCommentServerService } from "@/lib/services/postCommentServerService";
import { PlayerPostsServerService } from "@/lib/services/playerPostsServerService";
import { logger } from "@/lib/logger";
import { rewardActivity } from "@/lib/services/activityRewards";

const postCommentBodySchema = z.looseObject({ content: z.unknown().optional() });

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
export const POST = defineRoute(
  { auth: "required", rateLimit: "comment", writesContent: true, body: postCommentBodySchema },
  async ({ user, params, body }) => {
    const { postId } = params;

    const content = typeof body.content === "string" ? body.content : "";

    const post = await PlayerPostsServerService.getPost(postId);
    if (!post) throw notFound("Post not found");

    let comment: Awaited<ReturnType<typeof PostCommentServerService.createComment>>;
    try {
      comment = await PostCommentServerService.createComment(postId, user.id, content);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Content must be between 1 and 500 characters"
      ) {
        throw validationError(undefined, error.message);
      }
      throw error;
    }

    await rewardActivity({ kind: "post_comment_created", userId: user.id, commentId: comment.id });

    return NextResponse.json(comment, { status: 201 });
  }
);
