import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { DiscussionServerService } from "@/lib/services/discussionServerService";
import { NotificationServerService } from "@/lib/services/notificationServerService";
import { sendMessageSchema } from "@/lib/validations/discussion";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ conversationId: string }> };

/**
 * GET /api/discussions/[conversationId]/messages — Get paginated messages.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
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

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;

    const messagesResponse = await DiscussionServerService.getMessages(
      conversationId,
      user.id,
      cursor,
      limit
    );
    return NextResponse.json(messagesResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Conversation not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    logger.error("Error in discussions messages GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/discussions/[conversationId]/messages — Send a message.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
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

    const body = await request.json();
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const msg = await DiscussionServerService.sendMessage(
      conversationId,
      user.id,
      parsed.data.content
    );

    // Best-effort notification — failure must not block the 201 response
    try {
      const convSupabase = await createRouteHandlerClient();
      const { data: conversation } = await convSupabase
        .from("conversations")
        .select("participant_1, participant_2")
        .eq("id", conversationId)
        .single();

      if (conversation) {
        const recipientId =
          conversation.participant_1 === user.id
            ? conversation.participant_2
            : conversation.participant_1;

        await NotificationServerService.create(
          recipientId,
          user.id,
          "discussion_message",
          conversationId,
          parsed.data.content
        );
      }
    } catch (notifError) {
      logger.error("Failed to create discussion_message notification", {
        error: notifError instanceof Error ? notifError.message : notifError,
        conversationId,
        userId: user.id,
      });
    }

    return NextResponse.json(msg, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Conversation not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    logger.error("Error in discussions messages POST", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
