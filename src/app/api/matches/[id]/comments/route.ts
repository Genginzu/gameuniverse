import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getComments, addComment } from "@/lib/services/matchDiscussionService";
import { logger } from "@/lib/logger";
import { defineRoute, validationError } from "@/lib/api/route";

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

const addCommentSchema = z.looseObject({
  content: z.unknown().optional(),
  source: z.any().optional(),
});

export const POST = defineRoute(
  { auth: "required", rateLimit: "comment", writesContent: true, body: addCommentSchema },
  async ({ user, params, body }) => {
    const content = typeof body.content === "string" ? body.content.trim() : undefined;
    if (!content || content.length > 2000) throw validationError(undefined, "Invalid content");

    const supabase = await createRouteHandlerClient();
    const source = body.source || "pandascore";
    const comment = await addComment(supabase, {
      matchId: params.id,
      matchSource: source,
      playerId: user.id,
      content,
    });

    return NextResponse.json({ comment }, { status: 201 });
  }
);
