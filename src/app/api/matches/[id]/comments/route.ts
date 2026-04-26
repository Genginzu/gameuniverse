import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getComments, addComment } from "@/lib/services/matchDiscussionService";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const source = request.nextUrl.searchParams.get("source") || "pandascore";
    const supabase = await createRouteHandlerClient();
    const comments = await getComments(supabase, id, source);
    return NextResponse.json({ comments });
  } catch (error) {
    logger.error("Error fetching match comments", { error });
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const content = body.content?.trim();
    if (!content || content.length > 2000) {
      return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }

    const source = body.source || "pandascore";
    const comment = await addComment(supabase, {
      matchId: id,
      matchSource: source,
      playerId: user.id,
      content,
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    logger.error("Error adding match comment", { error });
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
