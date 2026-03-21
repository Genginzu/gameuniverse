import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

// POST /api/library/batch-status - Check library status for multiple games at once
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gameIds } = await request.json();

    if (!Array.isArray(gameIds) || gameIds.length === 0) {
      return NextResponse.json({ error: "gameIds array is required" }, { status: 400 });
    }

    // Limiter à 100 IDs par requête pour éviter les abus
    const limitedIds = gameIds.slice(0, 100);

    const { data, error } = await supabase
      .from("user_library")
      .select("game_id")
      .eq("user_id", user.id)
      .in("game_id", limitedIds);

    if (error) {
      if (error.code === "PGRST205") {
        logger.warn("user_library table not found - migration not applied yet");
        return NextResponse.json({ statuses: {} });
      }
      logger.error("Error batch checking library status", { error });
      return NextResponse.json({ error: "Failed to check library status" }, { status: 500 });
    }

    // Construire un map gameId → inLibrary
    const inLibrarySet = new Set(data?.map((row) => row.game_id) ?? []);
    const statuses: Record<string, boolean> = {};
    for (const id of limitedIds) {
      statuses[id] = inLibrarySet.has(id);
    }

    return NextResponse.json({ statuses });
  } catch (error) {
    logger.error("Error in library batch-status API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
