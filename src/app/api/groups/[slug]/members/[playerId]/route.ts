import { NextResponse } from "next/server";
import { GroupServerService } from "@/lib/services/groupServerService";
import { GroupMembersServerService } from "@/lib/services/groupMembersServerService";
import { updateGroupMemberSchema } from "@/lib/validations/group";
import { defineRoute, forbidden, notFound } from "@/lib/api/route";

/**
 * PATCH /api/groups/[slug]/members/[playerId] — Update a member's role.
 * Authentication required. Only owner/admin can change roles. The owner role
 * cannot be reassigned through this endpoint.
 */
export const PATCH = defineRoute(
  { auth: "required", body: updateGroupMemberSchema },
  async ({ user, params, body }) => {
    const { slug, playerId } = params;

    const access = await GroupServerService.getGroupAccess(slug);
    if (!access) throw notFound("Group not found");

    const requesterRole = await GroupMembersServerService.getMemberRole(access.id, user.id);
    if (requesterRole !== "owner" && requesterRole !== "moderator") throw forbidden("Forbidden");

    if (playerId === access.ownerId) throw forbidden("Cannot change the owner's role");

    await GroupMembersServerService.updateMemberRole(access.id, playerId, body.role);

    return NextResponse.json({ success: true });
  }
);

/**
 * DELETE /api/groups/[slug]/members/[playerId] — Remove a member from a group.
 * Authentication required. Members can remove themselves; owner/admin can remove others.
 * The owner cannot be removed.
 */
export const DELETE = defineRoute({ auth: "required" }, async ({ user, params }) => {
  const { slug, playerId } = params;

  const access = await GroupServerService.getGroupAccess(slug);
  if (!access) throw notFound("Group not found");

  if (playerId === access.ownerId) throw forbidden("Cannot remove the owner");

  const isSelf = playerId === user.id;
  if (!isSelf) {
    const requesterRole = await GroupMembersServerService.getMemberRole(access.id, user.id);
    if (requesterRole !== "owner" && requesterRole !== "moderator") throw forbidden("Forbidden");
  }

  await GroupMembersServerService.leaveGroup(access.id, playerId);

  return new NextResponse(null, { status: 204 });
});
