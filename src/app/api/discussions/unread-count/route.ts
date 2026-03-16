import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { DiscussionServerService } from "@/lib/services/discussionServerService";
import { logger } from "@/lib/logger";

/**
 * GET /api/discussions/unread-count — Get total unread message count.
 */
export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const count = await DiscussionServerService.getUnreadCount(user.id);
    return NextResponse.json({ count });
  } catch (error) {
    logger.error("Error in discussions unread-count GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
