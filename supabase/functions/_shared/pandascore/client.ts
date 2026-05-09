/**
 * PandaScore HTTP client — Deno port of src/lib/pandascore/client.ts.
 *
 * Behaviour mirrors the Vercel client:
 *   - Bearer auth via PANDASCORE_API_KEY env
 *   - Retries on 429/500 with respect for `retry-after` header
 *   - Structured logging via _shared/logger.ts
 *
 * The Vercel-specific `cache: "no-store"` is dropped (no Next.js fetch cache
 * in Deno). An AbortSignal timeout is added to bound outgoing calls so a
 * stalled PandaScore endpoint can't eat our 400s wall-clock budget.
 */

import { logger } from "../logger.ts";
import type {
  PandaScoreIncident,
  PandaScoreListParams,
  PandaScoreMatch,
  PandaScorePlayer,
  PandaScoreTeam,
  PandaScoreTournament,
} from "./types.ts";

const BASE_URL = "https://api.pandascore.co";
// 429 backoff: PandaScore's free/standard plans are limited to ~2-4 req/s.
// When we hit 429 we honour Retry-After if present, otherwise back off
// 5s -> 15s -> 30s. Three retries gives us ~50s total which is enough to
// let any rolling-window rate limit reset.
const RETRY_DELAYS = [5000, 15000, 30000];
/** Per-request timeout. Two-thirds of a typical chunk budget so a single
 *  slow page can't dominate. */
const REQUEST_TIMEOUT_MS = 30_000;

function getApiKey(): string {
  const key = Deno.env.get("PANDASCORE_API_KEY");
  if (!key) {
    throw new Error("PANDASCORE_API_KEY is not configured");
  }
  return key;
}

function buildUrl(path: string, params?: PandaScoreListParams): string {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function request<T>(
  path: string,
  params?: PandaScoreListParams,
): Promise<T> {
  const url = buildUrl(path, params);
  const headers = {
    Authorization: `Bearer ${getApiKey()}`,
    Accept: "application/json",
  };

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, { headers, signal: controller.signal });
    } catch (error) {
      clearTimeout(timeoutId);
      if (attempt < RETRY_DELAYS.length) {
        const delay = RETRY_DELAYS[attempt];
        logger.warn("PandaScore network error, retrying", {
          path,
          attempt: attempt + 1,
          delay,
          error: error instanceof Error ? error.message : String(error),
        });
        await sleep(delay);
        continue;
      }
      throw error;
    }
    clearTimeout(timeoutId);

    if (response.ok) return response.json() as Promise<T>;

    if (
      (response.status === 429 || response.status === 500) &&
      attempt < RETRY_DELAYS.length
    ) {
      const retryAfter =
        parseInt(response.headers.get("retry-after") ?? "0", 10) * 1000;
      const delay =
        response.status === 429 && retryAfter > 0
          ? retryAfter
          : RETRY_DELAYS[attempt];
      logger.warn("PandaScore retry", {
        status: response.status,
        path,
        attempt: attempt + 1,
        delay,
      });
      await sleep(delay);
      continue;
    }

    const body = await response.text().catch(() => "");
    logger.error("PandaScore API error", { status: response.status, path, body });
    throw new Error(
      `PandaScore API error: ${response.status} ${response.statusText}`,
    );
  }

  throw new Error("PandaScore API: max retries exceeded");
}

// -- Public API -----------------------------------------------------------

export function getTournaments(params?: PandaScoreListParams) {
  return request<PandaScoreTournament[]>("/tournaments", params);
}
export function getUpcomingTournaments(params?: PandaScoreListParams) {
  return request<PandaScoreTournament[]>("/tournaments/upcoming", params);
}
export function getRunningTournaments(params?: PandaScoreListParams) {
  return request<PandaScoreTournament[]>("/tournaments/running", params);
}
export function getPastTournaments(params?: PandaScoreListParams) {
  return request<PandaScoreTournament[]>("/tournaments/past", params);
}
export function getTournamentById(id: number) {
  return request<PandaScoreTournament>(`/tournaments/${id}`);
}

export function getMatches(params?: PandaScoreListParams) {
  return request<PandaScoreMatch[]>("/matches", params);
}
export function getRunningMatches(params?: PandaScoreListParams) {
  return request<PandaScoreMatch[]>("/matches/running", params);
}
export function getPastMatches(params?: PandaScoreListParams) {
  return request<PandaScoreMatch[]>("/matches/past", params);
}
export function getUpcomingMatches(params?: PandaScoreListParams) {
  return request<PandaScoreMatch[]>("/matches/upcoming", params);
}
export function getMatchById(id: number) {
  return request<PandaScoreMatch>(`/matches/${id}`);
}

export function getTeams(params?: PandaScoreListParams) {
  return request<PandaScoreTeam[]>("/teams", params);
}
export function getTeamById(id: number) {
  return request<PandaScoreTeam>(`/teams/${id}`);
}

export function getPlayers(params?: PandaScoreListParams) {
  return request<PandaScorePlayer[]>("/players", params);
}
export function getPlayerById(id: number) {
  return request<PandaScorePlayer>(`/players/${id}`);
}

// -- Incidents API (incremental sync) -------------------------------------

export function getAdditions(params?: PandaScoreListParams) {
  return request<PandaScoreIncident[]>("/additions", params);
}
export function getChanges(params?: PandaScoreListParams) {
  return request<PandaScoreIncident[]>("/changes", params);
}
export function getDeletions(params?: PandaScoreListParams) {
  return request<PandaScoreIncident[]>("/deletions", params);
}
