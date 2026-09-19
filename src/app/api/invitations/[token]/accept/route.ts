import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { GroupInvitationsServerService } from "@/lib/services/groupInvitationsServerService";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ token: string }> };

/**
 * POST /api/invitations/[token]/accept — Accept a group invitation.
 * Authentication required. The invitation must be addressed to the caller,
 * still pending, not expired, and the group must not have reached 50 members.
 */
export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const { token } = await params;

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await GroupInvitationsServerService.acceptInvitation(token, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "Invitation not found"
        ? 404
        : message === "This invitation is not addressed to you"
          ? 403
          : message === "This invitation has already been answered" ||
              message === "This invitation has expired" ||
              message === "This group has reached the maximum of 50 members"
            ? 409
            : 500;

    if (status === 500) {
      logger.error("Error in invitation accept POST", { error });
    }

    return NextResponse.json({ error: message }, { status });
  }
}
