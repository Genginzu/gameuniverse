import { getMatchById } from "@/lib/pandascore/client";
import type { PandaScoreMatch } from "@/lib/pandascore/types";

/** Match facts used to place a prediction, all taken from PandaScore. */
export interface BettableMatch {
  matchId: number;
  matchName: string;
  game: string;
  winnerId: number;
  winnerName: string;
}

/** The prediction is refused for a business reason (match closed, bad opponent). */
export class PredictionRejectedError extends Error {}

/**
 * Validate a prediction against the PandaScore match instead of trusting the
 * client: the match must not have started yet and the predicted winner must be
 * one of its two opponents. Without this, a player could bet on an already
 * finished match whose winner is known and get paid 2x by the resolver.
 */
export function assertBettable(
  match: PandaScoreMatch,
  predictedWinnerId: number,
  now: number = Date.now()
): BettableMatch {
  if (match.status !== "not_started") {
    throw new PredictionRejectedError("Predictions are closed for this match");
  }
  if (!match.begin_at || Date.parse(match.begin_at) <= now) {
    throw new PredictionRejectedError("Predictions are closed for this match");
  }

  const opponents = (match.opponents ?? []).map((o) => o.opponent);
  if (opponents.length !== 2) {
    throw new PredictionRejectedError("This match has no confirmed opponents yet");
  }

  const winner = opponents.find((o) => o.id === predictedWinnerId);
  if (!winner) {
    throw new PredictionRejectedError("The predicted winner does not play this match");
  }

  return {
    matchId: match.id,
    matchName: match.name,
    game: match.videogame?.name ?? "",
    winnerId: winner.id,
    winnerName: winner.name,
  };
}

export async function fetchBettableMatch(
  matchId: number,
  predictedWinnerId: number
): Promise<BettableMatch> {
  const match = await getMatchById(matchId);
  return assertBettable(match, predictedWinnerId);
}
