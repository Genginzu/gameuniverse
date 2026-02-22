import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { PlayerService } from "@/lib/services/playerService";
import { LibraryComparisonService } from "@/lib/services/libraryComparisonService";
import { logger } from "@/lib/logger";

/**
 * GET /api/players/[id]/common-games
 * Returns the common games between the authenticated user and the target player.
 * Query params: locale (default "fr"), page (default 1)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createRouteHandlerClient();

    // Authenticate the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: targetPlayerId } = await params;

    // Validate UUID format
    if (!PlayerService.validatePlayerId(targetPlayerId)) {
      return NextResponse.json({ error: "Invalid player ID format" }, { status: 400 });
    }

    // Reject self-comparison
    if (user.id === targetPlayerId) {
      return NextResponse.json({ error: "Cannot compare with yourself" }, { status: 400 });
    }

    // Verify target player exists
    const exists = await PlayerService.playerExists(targetPlayerId);
    if (!exists) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

    const result = await LibraryComparisonService.getCommonGames(
      user.id,
      targetPlayerId,
      locale,
      page
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error in common-games GET API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
