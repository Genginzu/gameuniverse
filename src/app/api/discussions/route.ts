import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { DiscussionServerService } from "@/lib/services/discussionServerService";
import { createConversationSchema } from "@/lib/validations/discussion";
import { logger } from "@/lib/logger";

/**
 * GET /api/discussions — List conversations for the authenticated user.
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

    const conversations = await DiscussionServerService.getConversations(user.id);
    return NextResponse.json({ conversations });
  } catch (error) {
    logger.error("Error in discussions GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/discussions — Create a new conversation with a friend.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createConversationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const conversation = await DiscussionServerService.createConversation(
      user.id,
      parsed.data.friendId
    );
    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Cannot create conversation: not friends") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    logger.error("Error in discussions POST", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
