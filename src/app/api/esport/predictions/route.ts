import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import {
  placePrediction,
  getMyPredictions,
  getLeaderboard,
} from "@/lib/services/esportPredictionService";
import { fetchBettableMatch, PredictionRejectedError } from "@/lib/services/esportPredictionGuard";
import { logger } from "@/lib/logger";
import { enforceRateLimit } from "@/lib/services/rateLimitService";

/** Only ids and the stake come from the client; match facts come from PandaScore. */
const placePredictionSchema = z.object({
  matchId: z.coerce.number().int().positive(),
  predictedWinnerId: z.coerce.number().int().positive(),
  amount: z.number().int().min(1).max(100000),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");

    if (view === "leaderboard") {
      const leaderboard = await getLeaderboard();
      return NextResponse.json({ leaderboard });
    }

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limited = await enforceRateLimit("prediction", { userId: user.id });
    if (limited) return limited;

    const parsed = placePredictionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid prediction data" }, { status: 400 });
    }
    const { matchId, predictedWinnerId, amount } = parsed.data;

    let match;
    try {
      match = await fetchBettableMatch(matchId, predictedWinnerId);
    } catch (error) {
      if (error instanceof PredictionRejectedError) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      logger.error("Could not load match for prediction", { matchId, error });
      return NextResponse.json({ error: "Match unavailable, try again later" }, { status: 503 });
    }

    const prediction = await placePrediction(user.id, match, amount);
    return NextResponse.json({ prediction }, { status: 201 });
  } catch (error) {
    logger.error("Error in esport predictions POST", { error });
    const message =
      error instanceof Error && error.message === "Insufficient balance"
        ? error.message
        : "Failed to place prediction";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
