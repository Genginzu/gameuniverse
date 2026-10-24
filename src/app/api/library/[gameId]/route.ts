import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { defineRoute, validationError } from "@/lib/api/route";

// DELETE /api/library/[gameId] - Remove game from user's library
export const DELETE = defineRoute(
  { auth: "required", rateLimit: "library" },
  async ({ user, params }) => {
    const supabase = await createRouteHandlerClient();
    const { gameId } = params;

    if (!gameId) {
      throw validationError(undefined, "Game ID is required");
    }

    // Remove game from user's library
    const { error } = await supabase
      .from("user_library")
      .delete()
      .eq("user_id", user.id)
      .eq("game_id", gameId);

    if (error) {
      // PGRST205 = table not found (migration not applied yet)
      if (error.code === "PGRST205") {
        logger.warn("user_library table not found - migration not applied yet");
        return NextResponse.json({ success: true }); // Retourner succès car rien à supprimer
      }
      logger.error("Error removing game from library", { error });
      return NextResponse.json({ error: "Failed to remove game from library" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }
);

// GET /api/library/[gameId] - Check if game is in user's library
export const GET = defineRoute({ auth: "required" }, async ({ user, params }) => {
  const supabase = await createRouteHandlerClient();
  const { gameId } = params;

  if (!gameId) {
    throw validationError(undefined, "Game ID is required");
  }

  // Check if game is in user's library
  const { data, error } = await supabase
    .from("user_library")
    .select("id, status, added_at")
    .eq("user_id", user.id)
    .eq("game_id", gameId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    // PGRST205 = table not found (migration not applied yet)
    if (error.code === "PGRST205") {
      logger.warn("user_library table not found - migration not applied yet");
      return NextResponse.json({
        inLibrary: false,
        status: undefined,
        addedAt: undefined,
      });
    }
    logger.error("Error checking game in library", { error });
    return NextResponse.json({ error: "Failed to check library status" }, { status: 500 });
  }

  return NextResponse.json({
    inLibrary: !!data,
    status: data?.status,
    addedAt: data?.added_at,
  });
});
