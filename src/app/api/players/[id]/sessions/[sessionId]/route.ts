import { NextResponse } from "next/server";
import { GameSessionsServerService } from "@/lib/services/gameSessionsServerService";
import { defineRoute, forbidden, notFound } from "@/lib/api/route";

/** DELETE /api/players/[id]/sessions/[sessionId] — Owner-only deletion. */
export const DELETE = defineRoute({ auth: "required" }, async ({ user, params }) => {
  const { id: playerId, sessionId } = params;

  if (user.id !== playerId) {
    throw forbidden("Forbidden");
  }

  const session = await GameSessionsServerService.getSession(sessionId);
  if (!session) {
    throw notFound("Session not found");
  }
  if (session.userId !== user.id) {
    throw forbidden("Forbidden");
  }

  await GameSessionsServerService.deleteSession(sessionId);
  return NextResponse.json({ success: true });
});
