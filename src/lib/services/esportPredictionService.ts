import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import { CoinService } from "@/lib/services/coinService";
import { untypedTable } from "@/lib/utils/untypedTable";
import type { BettableMatch } from "@/lib/services/esportPredictionGuard";

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
  playerName: string;
  totalPredictions: number;
  correctPredictions: number;
  totalProfit: number;
  accuracyRate: number | null;
}

export async function placePrediction(
  playerId: string,
  match: BettableMatch,
  amount: number
): Promise<EsportPrediction> {
  // Atomically debit coins and insert the prediction via a SECURITY DEFINER
  // DB function. The service-role client is the only role allowed to execute it
  // (issue #372), so a client can neither insert a prediction directly nor
  // split the debit from the insert. Match facts come from PandaScore
  // (fetchBettableMatch), never from the request body.
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.rpc("place_esport_prediction", {
    p_player_id: playerId,
    p_match_id: match.matchId,
    p_match_name: match.matchName,
    p_game: match.game,
    p_predicted_winner_id: match.winnerId,
    p_predicted_winner_name: match.winnerName,
    p_amount: amount,
  });

  if (error || !data) {
    logger.error("Failed to place prediction", { playerId, matchId: match.matchId, error });
    // Surface the function's own message (e.g. "Insufficient balance").
    throw new Error(error?.message || "Failed to place prediction");
  }

  return mapPrediction(data as Record<string, unknown>);
}

export async function getMyPredictions(playerId: string): Promise<EsportPrediction[]> {
  const supabase = await createRouteHandlerClient();
  const { data, error } = await untypedTable(supabase, "esport_predictions")
    .select("*")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Failed to fetch predictions", { playerId, error });
    throw new Error("Failed to fetch predictions");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map(mapPrediction);
}

/**
 * Resolve all pending predictions for a finished match.
 * Can be called from cron without re-fetching from PandaScore.
 */
export async function resolvePredictionsForMatch(matchId: number, winnerId: number): Promise<number> {
  // Server-internal callback (no user context): use the service-role client so
  // prediction updates and coin credits bypass the client-only RLS (issue #372).
  const supabase = getSupabaseAdmin();

  // Get all pending predictions for this match
  const { data: predictions, error } = await untypedTable(supabase, "esport_predictions")
    .select("*")
    .eq("match_id", matchId)
    .eq("status", "pending");

  if (error || !predictions?.length) return 0;

  let resolved = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const pred of predictions as any[]) {
    const won = pred.predicted_winner_id === winnerId;
    const payout = won ? pred.amount * 2 : 0;

    // Claim the row atomically: concurrent resolver runs (cron + Edge callback)
    // must not settle and credit the same prediction twice.
    const { data: claimed } = await untypedTable(supabase, "esport_predictions")
      .update({
        status: won ? "won" : "lost",
        payout,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", pred.id)
      .eq("status", "pending")
      .select("id");

    if (!claimed?.length) continue;

    if (won) {
      await CoinService.creditCoins(
        pred.player_id,
        payout,
        "prediction_win",
        undefined,
        undefined,
        `Gain pronostic: ${pred.match_name}`
      );
    }
    resolved++;
  }

  return resolved;
}

export async function getLeaderboard(): Promise<PredictionLeaderboardEntry[]> {
  const supabase = await createRouteHandlerClient();
  const { data, error } = await untypedTable(supabase, "esport_prediction_leaderboard")
    .select("*")
    .order("total_profit", { ascending: false })
    .limit(50);

  if (error) {
    logger.error("Failed to fetch prediction leaderboard", { error });
    return [];
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const playerIds = rows.map((r) => r.player_id as string);

  let namesMap: Record<string, string> = {};
  if (playerIds.length > 0) {
    const { data: players } = await untypedTable(supabase, "profiles")
      .select("id, username")
      .in("id", playerIds);
    if (players) {
      namesMap = Object.fromEntries(
        (players as { id: string; username: string | null }[]).map((p) => [p.id, p.username ?? ""])
      );
    }
  }

  return rows.map((row) => ({
    playerId: row.player_id as string,
    playerName: namesMap[row.player_id as string] || "Anonymous",
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
