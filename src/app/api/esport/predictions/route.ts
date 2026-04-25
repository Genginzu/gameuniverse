import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import {
  placePrediction,
  getMyPredictions,
  getLeaderboard,
} from "@/lib/services/esportPredictionService";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");

    if (view === "leaderboard") {
      const leaderboard = await getLeaderboard();
      return NextResponse.json({ leaderboard });
    }

    const supabase = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const predictions = await getMyPredictions(user.id);
    return NextResponse.json({ predictions });
  } catch (error) {
    logger.error("Error in esport predictions GET", { error });
    return NextResponse.json({ error: "Failed to fetch predictions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { matchId, matchName, game, predictedWinnerId, predictedWinnerName, amount } = body;

    if (!matchId || !predictedWinnerId || !amount || amount < 1) {
      return NextResponse.json({ error: "Invalid prediction data" }, { status: 400 });
    }

    const prediction = await placePrediction(
      user.id, matchId, matchName, game, predictedWinnerId, predictedWinnerName, amount
    );
    return NextResponse.json({ prediction }, { status: 201 });
  } catch (error) {
    logger.error("Error in esport predictions POST", { error });
    const message = error instanceof Error ? error.message : "Failed to place prediction";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
