import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { GroupServerService } from "@/lib/services/groupServerService";
import { GroupMembersServerService } from "@/lib/services/groupMembersServerService";
import { GroupInvitationsServerService } from "@/lib/services/groupInvitationsServerService";
import { createGroupInvitationSchema } from "@/lib/validations/group";
import { logger } from "@/lib/logger";

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
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invitations = await GroupInvitationsServerService.fetchGroupInvitations(access.id);

    return NextResponse.json({ invitations });
  } catch (error) {
    logger.error("Error in group invitations GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/groups/[slug]/invitations — Invite a player by email or username.
 * Authentication required. Only owner/admin members can invite.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
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
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createGroupInvitationSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
    }

    const group = await GroupServerService.fetchGroupBySlug(slug);
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const invitation = await GroupInvitationsServerService.createInvitation(
      access.id,
      slug,
      group.name,
      user.id,
      parsed.data
    );

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "Player not found" || message === "Either email or username is required"
        ? 404
        : message === "An invitation is already pending for this player"
          ? 409
          : 500;

    if (status === 500) {
      logger.error("Error in group invitations POST", { error });
    }

    return NextResponse.json({ error: message }, { status });
  }
}
