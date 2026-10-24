import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import {
  createTeam,
  getMyTeam,
  getLeaderboard,
} from "@/lib/services/fantasyService";
import { logger } from "@/lib/logger";
import { defineRoute, validationError } from "@/lib/api/route";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get("leagueId");
    const view = searchParams.get("view");

    if (!leagueId) return NextResponse.json({ error: "leagueId required" }, { status: 400 });

    if (view === "leaderboard") {
      const leaderboard = await getLeaderboard(leagueId);
      return NextResponse.json({ leaderboard });
    }

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const team = await getMyTeam(user.id, leagueId);
    return NextResponse.json({ team });
  } catch (error) {
    logger.error("Error in fantasy GET", { error });
    return NextResponse.json({ error: "Failed to fetch fantasy data" }, { status: 500 });
  }
}

const fantasyActionSchema = z.looseObject({
  action: z.unknown().optional(),
  leagueId: z.unknown().optional(),
  name: z.unknown().optional(),
});

/** createTeam is the only action that writes: the other ones answer 501 or 400, so charging every call is equivalent. */
export const POST = defineRoute(
  { auth: "required", rateLimit: "fantasyTeam", writesContent: true, body: fantasyActionSchema },
  async ({ user, body }) => {
    const { action, leagueId, name } = body;

    if (action === "createTeam") {
      if (typeof leagueId !== "string" || typeof name !== "string" || !name.trim()) {
        throw validationError(undefined, "leagueId and name are required");
      }
      const team = await createTeam(user.id, leagueId, name.trim().slice(0, 60));
      return NextResponse.json({ team }, { status: 201 });
    }

    // Roster changes need a server-side price for each pro player, which does
    // not exist yet: they were trusting a client-supplied price. Disabled until
    // a pricing model lands (migration 20261018000016 also locks them in RLS).
    if (action === "addPlayer" || action === "removePlayer") {
      return NextResponse.json({ error: "Fantasy rosters are not available yet" }, { status: 501 });
    }

    throw validationError(undefined, "Unknown action");
  }
);
