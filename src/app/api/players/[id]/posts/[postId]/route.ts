import { NextResponse } from "next/server";
import { defineRoute, forbidden, notFound } from "@/lib/api/route";
import { PlayerPostsServerService } from "@/lib/services/playerPostsServerService";

/**
 * DELETE /api/players/[id]/posts/[postId] — Delete a post.
 */
export const DELETE = defineRoute({ auth: "required" }, async ({ user, params }) => {
  const { postId } = params;

  const post = await PlayerPostsServerService.getPost(postId);
  if (!post) throw notFound("Post not found");

  if (post.playerId !== user.id) throw forbidden("Forbidden");

  await PlayerPostsServerService.deletePost(postId);
  return new NextResponse(null, { status: 204 });
});
