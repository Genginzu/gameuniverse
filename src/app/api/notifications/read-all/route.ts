import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { NotificationServerService } from "@/lib/services/notificationServerService";
import { logger } from "@/lib/logger";

/**
 * PATCH /api/notifications/read-all — Mark all unread notifications as read for the authenticated user.
 */
export async function PATCH() {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await NotificationServerService.markAllAsRead(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in notifications read-all PATCH", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
