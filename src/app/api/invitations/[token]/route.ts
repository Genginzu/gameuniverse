import { NextRequest, NextResponse } from "next/server";
import { GroupInvitationsServerService } from "@/lib/services/groupInvitationsServerService";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ token: string }> };

/**
 * GET /api/invitations/[token] — Fetch invitation details (group name/image,
 * inviter, status) for the acceptance page. No authentication required to
 * view — RLS on group_invitations still restricts row access to the invited
 * player or group owner/admins once acted upon via accept/decline.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { token } = await params;

    const invitation = await GroupInvitationsServerService.fetchInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    logger.error("Error in invitation GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
