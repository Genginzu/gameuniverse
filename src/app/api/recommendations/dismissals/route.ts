import { NextResponse } from "next/server";

import { defineRoute } from "@/lib/api/route";
import { logger } from "@/lib/logger";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { untypedTable } from "@/lib/utils/untypedTable";
import { recommendationDismissalSchema } from "@/lib/validations/recommendation";

// POST /api/recommendations/dismissals — "not interested": the game is never
// recommended to the caller again. Idempotent. RLS limits rows to the caller.
export const POST = defineRoute(
  { auth: "required", rateLimit: "recommendationFeedback", body: recommendationDismissalSchema },
  async ({ user, body }) => {
    const supabase = await createRouteHandlerClient();
    const { error } = await untypedTable(supabase, "recommendation_dismissals").upsert(
      { user_id: user.id, game_id: body.gameId },
      { onConflict: "user_id,game_id", ignoreDuplicates: true }
    );

    if (error) {
      logger.error("Failed to dismiss recommendation", { error, gameId: body.gameId });
      return NextResponse.json({ error: "Failed to dismiss recommendation" }, { status: 500 });
    }
    return NextResponse.json({ dismissed: true, gameId: body.gameId }, { status: 201 });
  }
);
