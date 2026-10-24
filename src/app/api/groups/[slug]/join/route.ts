import { NextResponse } from "next/server";
import { GroupServerService } from "@/lib/services/groupServerService";
import { GroupMembersServerService } from "@/lib/services/groupMembersServerService";
import { conflict, defineRoute, forbidden, notFound } from "@/lib/api/route";

/**
 * POST /api/groups/[slug]/join — Join a group as a regular member.
 * Authentication required.
 */
export const POST = defineRoute(
  { auth: "required", rateLimit: "membership" },
  async ({ user, params }) => {
    const { slug } = params;

    const access = await GroupServerService.getGroupAccess(slug);
    if (!access) throw notFound("Group not found");

    if (access.visibility === "private") {
      throw forbidden("Cannot join a private group directly");
    }

    const existingRole = await GroupMembersServerService.getMemberRole(access.id, user.id);
    if (existingRole !== null) throw conflict("Already a member");

    await GroupMembersServerService.joinGroup(access.id, user.id);

    return NextResponse.json({ success: true }, { status: 201 });
  }
);

/**
 * DELETE /api/groups/[slug]/join — Leave a group.
 * Authentication required. The owner cannot leave (must delete the group instead).
 */
export const DELETE = defineRoute(
  { auth: "required", rateLimit: "membership" },
  async ({ user, params }) => {
    const { slug } = params;

    const access = await GroupServerService.getGroupAccess(slug);
    if (!access) throw notFound("Group not found");

    if (access.ownerId === user.id) {
      throw forbidden("The owner cannot leave the group. Delete it instead.");
    }

    await GroupMembersServerService.leaveGroup(access.id, user.id);

    return new NextResponse(null, { status: 204 });
  }
);
