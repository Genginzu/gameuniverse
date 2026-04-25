import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { CoinService } from "@/lib/services/coinService";
import { getMatchById } from "@/lib/pandascore/client";

export interface EsportPrediction {
  id: string;
  playerId: string;
  matchId: number;
  matchName: string;
  game: string;
  predictedWinnerId: number;
  predictedWinnerName: string;
  amount: number;
  status: "pending" | "won" | "lost" | "cancelled";
  payout: number;
  createdAt: string;
}

export interface PredictionLeaderboardEntry {
  playerId: string;
  totalPredictions: number;
  correctPredictions: number;
  totalProfit: number;
  accuracyRate: number | null;
}

export async function placePrediction(
  playerId: string,
  matchId: number,
  matchName: string,
  game: string,
  predictedWinnerId: number,
  predictedWinnerName: string,
  amount: number
): Promise<EsportPrediction> {
  const supabase = await createRouteHandlerClient();

  // Deduct coins
  await CoinService.debitCoins(playerId, amount, "prediction", undefined, undefined, `Pronostic: ${matchName}`);

  const { data, error } = await supabase
    .from("esport_predictions")
    .insert({
      player_id: playerId,
      match_id: matchId,
      match_name: matchName,
      game,
      predicted_winner_id: predictedWinnerId,
      predicted_winner_name: predictedWinnerName,
      amount,
    })
    .select()
    .single();

  if (error) {
    logger.error("Failed to place prediction", { playerId, matchId, error });
    throw new Error("Failed to place prediction");
  }

  return mapPrediction(data);
}

export async function getMyPredictions(playerId: string): Promise<EsportPrediction[]> {
  const supabase = await createRouteHandlerClient();
  const { data, error } = await supabase
    .from("esport_predictions")
    .select("*")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Failed to fetch predictions", { playerId, error });
    throw new Error("Failed to fetch predictions");
  }

  return (data ?? []).map(mapPrediction);
}

export async function resolvePrediction(matchId: number): Promise<number> {
  const supabase = await createRouteHandlerClient();

  // Fetch match result from PandaScore
  const match = await getMatchById(matchId);
  if (match.status !== "finished" || !match.winner_id) return 0;

  const winnerId = match.winner_id;

  // Get all pending predictions for this match
  const { data: predictions, error } = await supabase
    .from("esport_predictions")
    .select("*")
    .eq("match_id", matchId)
    .eq("status", "pending");

  if (error || !predictions?.length) return 0;

  let resolved = 0;
  for (const pred of predictions) {
    const won = pred.predicted_winner_id === winnerId;
    const payout = won ? pred.amount * 2 : 0;

    await supabase
      .from("esport_predictions")
      .update({
        status: won ? "won" : "lost",
        payout,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", pred.id);

    if (won) {
      await CoinService.creditCoins(
        pred.player_id, payout, "prediction_win", undefined, undefined,
        `Gain pronostic: ${pred.match_name}`
      );
    }
    resolved++;
  }

  return resolved;
}

export async function getLeaderboard(): Promise<PredictionLeaderboardEntry[]> {
  const supabase = await createRouteHandlerClient();
  const { data, error } = await supabase
    .from("esport_prediction_leaderboard")
    .select("*")
    .order("total_profit", { ascending: false })
    .limit(50);

  if (error) {
    logger.error("Failed to fetch prediction leaderboard", { error });
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    playerId: row.player_id as string,
    totalPredictions: row.total_predictions as number,
    correctPredictions: row.correct_predictions as number,
    totalProfit: row.total_profit as number,
    accuracyRate: row.accuracy_rate as number | null,
  }));
}

function mapPrediction(row: Record<string, unknown>): EsportPrediction {
  return {
    id: row.id as string,
    playerId: row.player_id as string,
    matchId: row.match_id as number,
    matchName: row.match_name as string,
    game: row.game as string,
    predictedWinnerId: row.predicted_winner_id as number,
    predictedWinnerName: row.predicted_winner_name as string,
    amount: row.amount as number,
    status: row.status as EsportPrediction["status"],
    payout: (row.payout as number) ?? 0,
    createdAt: row.created_at as string,
  };
}
