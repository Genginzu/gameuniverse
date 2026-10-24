import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { GroupServerService } from "@/lib/services/groupServerService";
import { GroupMembersServerService } from "@/lib/services/groupMembersServerService";
import { GroupInvitationsServerService } from "@/lib/services/groupInvitationsServerService";
import { createGroupInvitationSchema } from "@/lib/validations/group";
import { logger } from "@/lib/logger";
import { conflict, defineRoute, forbidden, notFound } from "@/lib/api/route";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * GET /api/groups/[slug]/invitations — List all invitations for a group.
 * Authentication required. Only owner/admin members can view.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const access = await GroupServerService.getGroupAccess(slug);
    if (!access) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const role = await GroupMembersServerService.getMemberRole(access.id, user.id);
    if (role !== "owner" && role !== "moderator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invitations = await GroupInvitationsServerService.fetchGroupInvitations(access.id);

    return NextResponse.json({ invitations });
  } catch (error) {
    logger.error("Error in group invitations GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const NOT_FOUND_ERRORS = new Set(["Player not found", "Either email or username is required"]);
const CONFLICT_ERRORS = new Set(["An invitation is already pending for this player"]);

/**
 * POST /api/groups/[slug]/invitations — Invite a player by email or username.
 * Authentication required. Only owner/admin members can invite.
 */
export const POST = defineRoute(
  { auth: "required", rateLimit: "invitation", body: createGroupInvitationSchema },
  async ({ user, params, body }) => {
    const { slug } = params;

    const access = await GroupServerService.getGroupAccess(slug);
    if (!access) throw notFound("Group not found");

    const role = await GroupMembersServerService.getMemberRole(access.id, user.id);
    if (role !== "owner" && role !== "moderator") throw forbidden("Forbidden");

    const group = await GroupServerService.fetchGroupBySlug(slug);
    if (!group) throw notFound("Group not found");

    try {
      const invitation = await GroupInvitationsServerService.createInvitation(
        access.id,
        slug,
        group.name,
        user.id,
        body
      );

      return NextResponse.json({ invitation }, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (NOT_FOUND_ERRORS.has(message)) throw notFound(message);
      if (CONFLICT_ERRORS.has(message)) throw conflict(message);
      throw error;
    }
  }
);
