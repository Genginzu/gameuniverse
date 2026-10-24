import { NextResponse } from "next/server";
import { defineRoute, notFound } from "@/lib/api/route";
import { NotificationServerService } from "@/lib/services/notificationServerService";

/**
 * PATCH /api/notifications/[id]/read — Mark a single notification as read.
 */
export const PATCH = defineRoute({ auth: "required" }, async ({ user, params }) => {
  const { id } = params;
  const success = await NotificationServerService.markAsRead(id, user.id);

  if (!success) throw notFound("Notification not found");

  return NextResponse.json({ success: true });
});
