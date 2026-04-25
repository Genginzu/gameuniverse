import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { addReaction } from "@/lib/services/matchDiscussionService";
import { logger } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const emoji = body.emoji?.trim();
    if (!emoji) {
      return NextResponse.json({ error: "emoji is required" }, { status: 400 });
    }

    const comment = await addReaction(supabase, commentId, user.id, emoji);
    return NextResponse.json({ comment });
  } catch (error) {
    logger.error("Error adding reaction", { error });
    return NextResponse.json({ error: "Failed to add reaction" }, { status: 500 });
  }
}
