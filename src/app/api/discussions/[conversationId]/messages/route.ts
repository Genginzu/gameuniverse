import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { DiscussionServerService } from "@/lib/services/discussionServerService";
import { discussionMessageSent } from "@/lib/services/notifications";
import { sendMessageSchema } from "@/lib/validations/discussion";
import { logger } from "@/lib/logger";
import { CoinService } from "@/lib/services/coinService";
import { defineRoute, notFound } from "@/lib/api/route";

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
export const POST = defineRoute(
  { auth: "required", rateLimit: "message", writesContent: true, body: sendMessageSchema },
  async ({ user, params, body }) => {
    const { conversationId } = params;

    try {
      const msg = await DiscussionServerService.sendMessage(conversationId, user.id, body.content);

      await discussionMessageSent({
        conversationId,
        senderId: user.id,
        content: body.content,
      });

      CoinService.rewardActivity(user.id, "discussion_message", msg.id).catch((err) =>
        logger.error("Coin reward failed", { error: err })
      );

      return NextResponse.json(msg, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "Conversation not found") throw notFound(message);
      if (message === "Conversation closed") {
        return NextResponse.json({ error: message, code: "conversationClosed" }, { status: 409 });
      }
      throw error;
    }
  }
);
