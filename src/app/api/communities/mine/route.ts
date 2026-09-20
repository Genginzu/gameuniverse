import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { CommunityServerService } from "@/lib/services/communityServerService";
import { logger } from "@/lib/logger";

/**
 * GET /api/communities/mine — List communities the current user is a member
 * of, sorted alphabetically by name. Authentication required.
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

    const communities = await CommunityServerService.fetchMyCommunities(user.id);

    return NextResponse.json({ communities });
  } catch (error) {
    logger.error("Error in communities mine GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
