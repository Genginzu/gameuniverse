import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { GroupInvitationsServerService } from "@/lib/services/groupInvitationsServerService";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ token: string }> };

/**
 * POST /api/invitations/[token]/decline — Decline a group invitation.
 * Authentication required. The invitation must be addressed to the caller
 * and still pending.
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

    await GroupInvitationsServerService.declineInvitation(token, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "Invitation not found"
        ? 404
        : message === "This invitation is not addressed to you"
          ? 403
          : message === "This invitation has already been answered"
            ? 409
            : 500;

    if (status === 500) {
      logger.error("Error in invitation decline POST", { error });
    }

    return NextResponse.json({ error: message }, { status });
  }
}
