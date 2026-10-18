import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { NotificationServerService } from "@/lib/services/notificationServerService";
import { logger } from "@/lib/logger";

/**
 * PATCH /api/notifications/[id] — Toggle the read status of a single notification.
 * Body: `{ isRead: boolean }`.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body.isRead !== "boolean") {
      return NextResponse.json({ error: "isRead (boolean) is required" }, { status: 400 });
    }

    const { id } = await params;
    const success = await NotificationServerService.setReadStatus(id, user.id, body.isRead);

    if (!success) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in notification read-status PATCH", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
