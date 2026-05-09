/**
 * Callbacks back to the Vercel app for logic that wasn't ported to Deno.
 *
 * These two operations touch tables that depend on auth/notification logic
 * we'd rather not duplicate. The Edge Functions invoke an internal Vercel
 * route with a shared secret; the route does the actual work.
 *
 *   - reconcilePlayerTeamHistory: updates esport_player_team_history when
 *     a player's current_team changes.
 *   - resolvePredictionsForMatch: settles esport_predictions for finished
 *     matches with a known winner (notifications, GU coins, etc.).
 *
 * Failures are logged and swallowed: a failed callback must not abort the
 * sync; predictions/history can be reconciled later from the cron run.
 */

import { logger } from "../logger.ts";

function getCallbackBase(): string | null {
  const url = Deno.env.get("VERCEL_CALLBACK_BASE_URL");
  if (!url) {
    logger.warn("VERCEL_CALLBACK_BASE_URL not set, skipping Vercel callback");
    return null;
  }
  return url.replace(/\/+$/, "");
}

function getCallbackSecret(): string | null {
  const secret = Deno.env.get("VERCEL_CALLBACK_SECRET");
  if (!secret) {
    logger.warn("VERCEL_CALLBACK_SECRET not set, skipping Vercel callback");
    return null;
  }
  return secret;
}

/** Bounded HTTP timeout for callbacks. */
const CALLBACK_TIMEOUT_MS = 20_000;

async function callVercel(path: string, body: unknown): Promise<void> {
  const base = getCallbackBase();
  const secret = getCallbackSecret();
  if (!base || !secret) return;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CALLBACK_TIMEOUT_MS);

  try {
    const response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-edge-callback-secret": secret,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      logger.warn("Vercel callback failed", {
        path,
        status: response.status,
        body: text.slice(0, 200),
      });
    }
  } catch (error) {
    logger.warn("Vercel callback error", {
      path,
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface PlayerTeamHistoryInput {
  playerLocalId: string;
  newTeamLocalId: string | null;
}

export async function reconcilePlayerTeamHistory(
  inputs: PlayerTeamHistoryInput[],
): Promise<void> {
  if (inputs.length === 0) return;
  await callVercel("/api/internal/esport/reconcile-history", { inputs });
}

export async function resolvePredictionsForMatch(
  matchPandaId: number,
  winnerPandaId: number,
): Promise<void> {
  await callVercel("/api/internal/esport/resolve-predictions", {
    matchPandaId,
    winnerPandaId,
  });
}
