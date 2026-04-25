import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { GameSessionsServerService } from "@/lib/services/gameSessionsServerService";
import { logger } from "@/lib/logger";

/** DELETE /api/players/[id]/sessions/[sessionId] — Owner-only deletion. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { id: playerId, sessionId } = await params;

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (user.id !== playerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const session = await GameSessionsServerService.getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (session.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await GameSessionsServerService.deleteSession(sessionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in player session DELETE", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
