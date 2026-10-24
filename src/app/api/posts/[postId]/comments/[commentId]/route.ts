import { NextResponse } from "next/server";
import { defineRoute, forbidden, notFound } from "@/lib/api/route";
import { PostCommentServerService } from "@/lib/services/postCommentServerService";
import { PlayerPostsServerService } from "@/lib/services/playerPostsServerService";

/**
 * DELETE /api/posts/[postId]/comments/[commentId] — Delete a comment.
 * Allowed for the comment author or the post owner.
 */
export const DELETE = defineRoute({ auth: "required" }, async ({ user, params }) => {
  const { postId, commentId } = params;

  const post = await PlayerPostsServerService.getPost(postId);
  if (!post) throw notFound("Post not found");

  try {
    await PostCommentServerService.deleteComment(commentId, user.id, post.playerId, postId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "Comment not found") throw notFound("Comment not found");
    if (message === "Forbidden") throw forbidden("Forbidden");
    throw error;
  }
  return new NextResponse(null, { status: 204 });
});
