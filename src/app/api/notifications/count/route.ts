import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { NotificationServerService } from "@/lib/services/notificationServerService";
import { logger } from "@/lib/logger";

/**
 * GET /api/notifications/count — Return unread notification count for the authenticated user.
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

    const count = await NotificationServerService.getUnreadCount(user.id);

    return NextResponse.json({ count });
  } catch (error) {
    logger.error("Error in notifications count GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
