import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { DiscussionServerService } from "@/lib/services/discussionServerService";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ conversationId: string }> };

/**
 * PATCH /api/discussions/[conversationId]/read — Mark messages as read.
 */
export async function PATCH(_request: Request, { params }: RouteContext) {
  try {
    const { conversationId } = await params;

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await DiscussionServerService.markAsRead(conversationId, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Conversation not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    logger.error("Error in discussions read PATCH", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
