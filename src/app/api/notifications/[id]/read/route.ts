import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { NotificationServerService } from "@/lib/services/notificationServerService";
import { logger } from "@/lib/logger";

/**
 * PATCH /api/notifications/[id]/read — Mark a single notification as read.
 */
export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const success = await NotificationServerService.markAsRead(id, user.id);

    if (!success) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in notification mark-as-read PATCH", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
