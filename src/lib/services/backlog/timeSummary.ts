/**
 * Pure aggregation of backlog time metrics.
 */

import type { BacklogGame, BacklogTimeSummary } from "@/types/backlog";

/**
 * Computes total estimated remaining hours across a list of backlog games.
 *
 * Uses each game's `remainingHours` (full estimate minus time already played).
 * Games without a playtime estimate are counted separately and excluded from
 * the total (we do not fabricate numbers for them).
 */
export function computeTimeSummary(games: BacklogGame[]): BacklogTimeSummary {
  let totalEstimatedHours = 0;
  let gamesWithoutEstimate = 0;

  for (const game of games) {
    if (typeof game.remainingHours === "number") {
      totalEstimatedHours += game.remainingHours;
    } else {
      gamesWithoutEstimate += 1;
    }
  }

  return {
    gameCount: games.length,
    totalEstimatedHours: Math.round(totalEstimatedHours * 10) / 10,
    gamesWithoutEstimate,
  };
}
