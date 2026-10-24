import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { addReaction } from "@/lib/services/matchDiscussionService";
import { defineRoute, validationError } from "@/lib/api/route";

const reactionSchema = z.looseObject({ emoji: z.unknown().optional() });

export const POST = defineRoute(
  { auth: "required", rateLimit: "reaction", body: reactionSchema },
  async ({ params, body }) => {
    const emoji = typeof body.emoji === "string" ? body.emoji.trim() : "";
    if (!emoji || emoji.length > 16) throw validationError(undefined, "emoji is required");

    const supabase = await createRouteHandlerClient();
    const comment = await addReaction(supabase, params.commentId, emoji);
    return NextResponse.json({ comment });
  }
);
