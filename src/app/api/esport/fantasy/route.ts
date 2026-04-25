import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import {
  createTeam,
  addPlayer,
  removePlayer,
  getMyTeam,
  getLeaderboard,
} from "@/lib/services/fantasyService";
import { logger } from "@/lib/logger";

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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { action } = body;

    if (action === "createTeam") {
      const team = await createTeam(user.id, body.leagueId, body.name);
      return NextResponse.json({ team }, { status: 201 });
    }

    if (action === "addPlayer") {
      await addPlayer(body.teamId, body.proPlayerId, body.proPlayerName, body.price);
      return NextResponse.json({ success: true });
    }

    if (action === "removePlayer") {
      await removePlayer(body.teamId, body.teamPlayerId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    logger.error("Error in fantasy POST", { error });
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
