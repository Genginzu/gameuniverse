import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { untypedTable } from "@/lib/utils/untypedTable";
import { logger } from "@/lib/logger";

const updateSchema = z.object({
  // 0 none, 1 low, 2 medium, 3 high.
  priority: z.number().int().min(0).max(3),
});

// PATCH /api/library/backlog/[gameId] - Update a backlog entry's priority.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const supabase = await createRouteHandlerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gameId } = await params;
    if (!gameId) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { data, error } = await untypedTable(supabase, "user_library")
      .update({ priority: parsed.data.priority })
      .eq("user_id", user.id)
      .eq("game_id", gameId)
      .select("id")
      .maybeSingle();

    if (error) {
      logger.error("Error updating backlog priority", { error });
      return NextResponse.json({ error: "Failed to update priority" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Game not found in library" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in backlog priority API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
