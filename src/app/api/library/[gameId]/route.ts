import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";

// DELETE /api/library/[gameId] - Remove game from user's library
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const supabase = await createRouteHandlerClient();

    // Get authenticated user
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

    // Remove game from user's library
    const { error } = await supabase
      .from("user_library")
      .delete()
      .eq("user_id", user.id)
      .eq("game_id", gameId);

    if (error) {
      // PGRST205 = table not found (migration not applied yet)
      if (error.code === "PGRST205") {
        console.warn("user_library table not found - migration not applied yet");
        return NextResponse.json({ success: true }); // Retourner succès car rien à supprimer
      }
      console.error("Error removing game from library:", error);
      return NextResponse.json({ error: "Failed to remove game from library" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in library DELETE API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/library/[gameId] - Check if game is in user's library
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const supabase = await createRouteHandlerClient();

    // Get authenticated user
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
        console.warn("user_library table not found - migration not applied yet");
        return NextResponse.json({
          inLibrary: false,
          status: undefined,
          addedAt: undefined,
        });
      }
      console.error("Error checking game in library:", error);
      return NextResponse.json({ error: "Failed to check library status" }, { status: 500 });
    }

    return NextResponse.json({
      inLibrary: !!data,
      status: data?.status,
      addedAt: data?.added_at,
    });
  } catch (error) {
    console.error("Error in library GET API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
