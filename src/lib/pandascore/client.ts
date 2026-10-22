import { logger } from "@/lib/logger";
import type { PandaScoreListParams, PandaScoreMatch } from "./types";

const BASE_URL = "https://api.pandascore.co";
const RETRY_DELAYS = [1000, 3000, 8000];

function getApiKey(): string {
  const key = process.env.PANDASCORE_API_KEY;
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

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function request<T>(path: string, params?: PandaScoreListParams): Promise<T> {
  const url = buildUrl(path, params);
  const headers = { Authorization: `Bearer ${getApiKey()}`, Accept: "application/json" };

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    const response = await fetch(url, { headers, cache: "no-store" });

    if (response.ok) return response.json() as Promise<T>;

    if ((response.status === 429 || response.status === 500) && attempt < RETRY_DELAYS.length) {
      const retryAfter = parseInt(response.headers.get("retry-after") || "0", 10) * 1000;
      const delay = response.status === 429 && retryAfter > 0 ? retryAfter : RETRY_DELAYS[attempt];
      logger.warn("PandaScore retry", { status: response.status, path, attempt: attempt + 1, delay });
      await sleep(delay);
      continue;
    }

    const body = await response.text().catch(() => "");
    logger.error("PandaScore API error", { status: response.status, path, body });
    throw new Error(`PandaScore API error: ${response.status} ${response.statusText}`);
  }

  throw new Error("PandaScore API: max retries exceeded");
}

// -- Public API --

export function getUpcomingMatches(params?: PandaScoreListParams) {
  return request<PandaScoreMatch[]>("/matches/upcoming", params);
}

export function getRunningMatches(params?: PandaScoreListParams) {
  return request<PandaScoreMatch[]>("/matches/running", params);
}

export function getMatchById(id: number) {
  return request<PandaScoreMatch>(`/matches/${id}`);
}
