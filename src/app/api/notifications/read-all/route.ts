import { NextResponse } from "next/server";
import { defineRoute } from "@/lib/api/route";
import { NotificationServerService } from "@/lib/services/notificationServerService";

/**
 * PATCH /api/notifications/read-all — Mark all unread notifications as read for the authenticated user.
 */
export const PATCH = defineRoute({ auth: "required" }, async ({ user }) => {
  await NotificationServerService.markAllAsRead(user.id);

  return NextResponse.json({ success: true });
});
