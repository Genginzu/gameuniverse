import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { untypedTable } from "@/lib/utils/untypedTable";
import { logger } from "@/lib/logger";
import { defineRoute, notFound, validationError } from "@/lib/api/route";

const updateSchema = z.object({
  // 0 none, 1 low, 2 medium, 3 high.
  priority: z.number().int().min(0).max(3),
});

// PATCH /api/library/backlog/[gameId] - Update a backlog entry's priority.
export const PATCH = defineRoute(
  { auth: "required", body: updateSchema },
  async ({ user, params, body }) => {
    const supabase = await createRouteHandlerClient();

    const { gameId } = params;
    if (!gameId) {
      throw validationError(undefined, "Game ID is required");
    }

    const { data, error } = await untypedTable(supabase, "user_library")
      .update({ priority: body.priority })
      .eq("user_id", user.id)
      .eq("game_id", gameId)
      .select("id")
      .maybeSingle();

    if (error) {
      logger.error("Error updating backlog priority", { error });
      return NextResponse.json({ error: "Failed to update priority" }, { status: 500 });
    }

    if (!data) {
      throw notFound("Game not found in library");
    }

    return NextResponse.json({ success: true });
  }
);
