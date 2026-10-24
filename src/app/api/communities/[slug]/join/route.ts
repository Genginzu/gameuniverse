import { NextResponse } from "next/server";
import { CommunityServerService } from "@/lib/services/communityServerService";
import { CommunityMembersServerService } from "@/lib/services/communityMembersServerService";
import { conflict, defineRoute, forbidden, notFound } from "@/lib/api/route";

/**
 * POST /api/communities/[slug]/join — Join a community as a regular member.
 * Authentication required.
 */
export const POST = defineRoute(
  { auth: "required", rateLimit: "membership" },
  async ({ user, params }) => {
    const { slug } = params;

    const access = await CommunityServerService.getCommunityAccess(slug);
    if (!access) throw notFound("Community not found");

    if (access.visibility === "private") {
      throw forbidden("Cannot join a private community directly");
    }

    const existingRole = await CommunityMembersServerService.getMemberRole(access.id, user.id);
    if (existingRole !== null) throw conflict("Already a member");

    await CommunityMembersServerService.joinCommunity(access.id, user.id);

    return NextResponse.json({ success: true }, { status: 201 });
  }
);

/**
 * DELETE /api/communities/[slug]/join — Leave a community.
 * Authentication required. The owner cannot leave (must delete the community instead).
 */
export const DELETE = defineRoute(
  { auth: "required", rateLimit: "membership" },
  async ({ user, params }) => {
    const { slug } = params;

    const access = await CommunityServerService.getCommunityAccess(slug);
    if (!access) throw notFound("Community not found");

    if (access.ownerId === user.id) {
      throw forbidden("The owner cannot leave the community. Delete it instead.");
    }

    await CommunityMembersServerService.leaveCommunity(access.id, user.id);

    return new NextResponse(null, { status: 204 });
  }
);
