import { NextResponse } from "next/server";
import { CommunityServerService } from "@/lib/services/communityServerService";
import { CommunityMembersServerService } from "@/lib/services/communityMembersServerService";
import { CommunityPostsServerService } from "@/lib/services/communityPostsServerService";
import { defineRoute, forbidden, notFound } from "@/lib/api/route";

/**
 * DELETE /api/communities/[slug]/posts/[postId] — Delete a post.
 * Authentication required. The author can delete their own post; owner/moderator can moderate.
 */
export const DELETE = defineRoute({ auth: "required" }, async ({ user, params }) => {
  const { slug, postId } = params;

  const access = await CommunityServerService.getCommunityAccess(slug);
  if (!access) throw notFound("Community not found");

  const postAccess = await CommunityPostsServerService.getPostAccess(postId);
  if (!postAccess || postAccess.communityId !== access.id) throw notFound("Post not found");

  const isAuthor = postAccess.authorId === user.id;
  if (!isAuthor) {
    const role = await CommunityMembersServerService.getMemberRole(access.id, user.id);
    if (role !== "owner" && role !== "moderator") throw forbidden("Forbidden");
  }

  await CommunityPostsServerService.deletePost(postId);

  return new NextResponse(null, { status: 204 });
});
