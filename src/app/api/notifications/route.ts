import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { NotificationServerService } from "@/lib/services/notificationServerService";
import { logger } from "@/lib/logger";

/**
 * GET /api/notifications — List unread notifications for the authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const limit = Number(request.nextUrl.searchParams.get("limit")) || 20;
    const notifications = await NotificationServerService.getUnread(user.id, limit);

    return NextResponse.json({ notifications });
  } catch (error) {
    logger.error("Error in notifications GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
