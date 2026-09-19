import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { GroupServerService } from "@/lib/services/groupServerService";
import { logger } from "@/lib/logger";

/**
 * GET /api/groups/mine — List groups the current user is a member of,
 * sorted alphabetically by name. Authentication required.
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

    const groups = await GroupServerService.fetchMyGroups(user.id);

    return NextResponse.json({ groups });
  } catch (error) {
    logger.error("Error in groups mine GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
