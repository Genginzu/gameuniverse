import { NextResponse } from "next/server";
import { GroupServerService } from "@/lib/services/groupServerService";
import { GroupMembersServerService } from "@/lib/services/groupMembersServerService";
import { GroupPostsServerService } from "@/lib/services/groupPostsServerService";
import { defineRoute, forbidden, notFound } from "@/lib/api/route";

/**
 * DELETE /api/groups/[slug]/posts/[postId] — Delete a post.
 * Authentication required. The author can delete their own post; owner/admin can moderate.
 */
export const DELETE = defineRoute({ auth: "required" }, async ({ user, params }) => {
  const { slug, postId } = params;

  const access = await GroupServerService.getGroupAccess(slug);
  if (!access) throw notFound("Group not found");

  const postAccess = await GroupPostsServerService.getPostAccess(postId);
  if (!postAccess || postAccess.groupId !== access.id) throw notFound("Post not found");

  const isAuthor = postAccess.authorId === user.id;
  if (!isAuthor) {
    const role = await GroupMembersServerService.getMemberRole(access.id, user.id);
    if (role !== "owner" && role !== "moderator") throw forbidden("Forbidden");
  }

  await GroupPostsServerService.deletePost(postId);

  return new NextResponse(null, { status: 204 });
});
