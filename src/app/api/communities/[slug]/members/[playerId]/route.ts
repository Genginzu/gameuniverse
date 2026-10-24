import { NextResponse } from "next/server";
import { CommunityServerService } from "@/lib/services/communityServerService";
import { CommunityMembersServerService } from "@/lib/services/communityMembersServerService";
import { updateCommunityMemberSchema } from "@/lib/validations/community";
import { defineRoute, forbidden, notFound } from "@/lib/api/route";

/**
 * PATCH /api/communities/[slug]/members/[playerId] — Update a member's role.
 * Authentication required. Only owner/moderator can change roles. The owner role
 * cannot be reassigned through this endpoint.
 */
export const PATCH = defineRoute(
  { auth: "required", body: updateCommunityMemberSchema },
  async ({ user, params, body }) => {
    const { slug, playerId } = params;

    const access = await CommunityServerService.getCommunityAccess(slug);
    if (!access) throw notFound("Community not found");

    const requesterRole = await CommunityMembersServerService.getMemberRole(access.id, user.id);
    if (requesterRole !== "owner" && requesterRole !== "moderator") throw forbidden("Forbidden");

    if (playerId === access.ownerId) throw forbidden("Cannot change the owner's role");

    await CommunityMembersServerService.updateMemberRole(access.id, playerId, body.role);

    return NextResponse.json({ success: true });
  }
);

/**
 * DELETE /api/communities/[slug]/members/[playerId] — Remove a member from a community.
 * Authentication required. Members can remove themselves; owner/moderator can remove others.
 * The owner cannot be removed.
 */
export const DELETE = defineRoute({ auth: "required" }, async ({ user, params }) => {
  const { slug, playerId } = params;

  const access = await CommunityServerService.getCommunityAccess(slug);
  if (!access) throw notFound("Community not found");

  if (playerId === access.ownerId) throw forbidden("Cannot remove the owner");

  const isSelf = playerId === user.id;
  if (!isSelf) {
    const requesterRole = await CommunityMembersServerService.getMemberRole(access.id, user.id);
    if (requesterRole !== "owner" && requesterRole !== "moderator") throw forbidden("Forbidden");
  }

  await CommunityMembersServerService.leaveCommunity(access.id, playerId);

  return new NextResponse(null, { status: 204 });
});
