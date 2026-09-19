import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { fetchMyInvitations } from "@/lib/services/groupInvitationsMineQueries";
import { logger } from "@/lib/logger";

/**
 * GET /api/invitations/mine — List pending group invitations addressed to
 * the current user. Authentication required.
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invitations = await fetchMyInvitations(user.id);

    return NextResponse.json({ invitations });
  } catch (error) {
    logger.error("Error in invitations mine GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
