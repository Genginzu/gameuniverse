import { logger } from "@/lib/logger";
import type {
  PandaScoreListParams,
  PandaScoreMatch,
  PandaScorePlayer,
  PandaScoreTeam,
  PandaScoreTournament,
  PandaScoreVideogame,
} from "./types";

const BASE_URL = "https://api.pandascore.co";

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

async function request<T>(path: string, params?: PandaScoreListParams): Promise<T> {
  const url = buildUrl(path, params);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    logger.error("PandaScore API error", { status: response.status, path, body });
    throw new Error(`PandaScore API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

// -- Public API --

export function getVideogames(params?: PandaScoreListParams) {
  return request<PandaScoreVideogame[]>("/videogames", params);
}

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

export function getUpcomingMatches(params?: PandaScoreListParams) {
  return request<PandaScoreMatch[]>("/matches/upcoming", params);
}

export function getRunningMatches(params?: PandaScoreListParams) {
  return request<PandaScoreMatch[]>("/matches/running", params);
}

export function getPastMatches(params?: PandaScoreListParams) {
  return request<PandaScoreMatch[]>("/matches/past", params);
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

// -- Incidents API (for incremental sync) --

export interface PandaScoreIncident {
  id: number;
  modified_at: string;
  type: string;
  change_type: "addition" | "change" | "deletion";
  object: Record<string, unknown>;
}

export function getAdditions(params?: PandaScoreListParams) {
  return request<PandaScoreIncident[]>("/additions", params);
}

export function getChanges(params?: PandaScoreListParams) {
  return request<PandaScoreIncident[]>("/changes", params);
}

export function getDeletions(params?: PandaScoreListParams) {
  return request<PandaScoreIncident[]>("/deletions", params);
}
