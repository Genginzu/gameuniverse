import { NextResponse } from "next/server";

import { defineRoute } from "@/lib/api/route";
import { logger } from "@/lib/logger";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { untypedTable } from "@/lib/utils/untypedTable";
import { recommendationDismissalParamsSchema } from "@/lib/validations/recommendation";

// DELETE /api/recommendations/dismissals/[gameId] — undo a "not interested".
export const DELETE = defineRoute(
  {
    auth: "required",
    rateLimit: "recommendationFeedback",
    params: recommendationDismissalParamsSchema,
  },
  async ({ user, params }) => {
    const supabase = await createRouteHandlerClient();
    const { error } = await untypedTable(supabase, "recommendation_dismissals")
      .delete()
      .eq("user_id", user.id)
      .eq("game_id", params.gameId);

    if (error) {
      logger.error("Failed to restore recommendation", { error, gameId: params.gameId });
      return NextResponse.json({ error: "Failed to restore recommendation" }, { status: 500 });
    }
    return NextResponse.json({ dismissed: false, gameId: params.gameId });
  }
);
