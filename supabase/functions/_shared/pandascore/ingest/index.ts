import { mapMatch, mapPlayer, mapTeam, mapTournament } from "../mappers.ts";
import type {
  PandaScoreMatch,
  PandaScorePlayer,
  PandaScoreTeam,
  PandaScoreTournament,
} from "../types.ts";
import { bulkUpsert, preloadIdMap } from "./persistence.ts";
import { reconcileTeamHistory, settleFinishedMatches } from "./side-effects.ts";
import type { IngestDeps, IngestResult } from "./types.ts";

export type {
  EsportDb,
  IngestDeps,
  IngestResult,
  IngestSideEffects,
  PlayerTeamHistoryInput,
} from "./types.ts";

const EMPTY_RESULT: IngestResult = { synced: 0, errors: 0 };

function isNumber(value: number | null | undefined): value is number {
  return typeof value === "number";
}

function upsertRows(
  deps: IngestDeps,
  table: string,
  errorType: string,
  rows: Record<string, unknown>[],
): Promise<IngestResult> {
  return bulkUpsert(deps.db, table, rows, {
    errorCollector: deps.errors,
    errorType,
  });
}

export async function ingestTeams(
  deps: IngestDeps,
  teams: PandaScoreTeam[],
): Promise<IngestResult> {
  if (teams.length === 0) return { ...EMPTY_RESULT };
  return upsertRows(deps, "esport_teams", "team", teams.map(mapTeam));
}

export async function ingestTournaments(
  deps: IngestDeps,
  tournaments: PandaScoreTournament[],
): Promise<IngestResult> {
  if (tournaments.length === 0) return { ...EMPTY_RESULT };
  return upsertRows(
    deps,
    "esport_tournaments",
    "tournament",
    tournaments.map(mapTournament),
  );
}

export async function ingestPlayers(
  deps: IngestDeps,
  players: PandaScorePlayer[],
): Promise<IngestResult> {
  if (players.length === 0) return { ...EMPTY_RESULT };
  const teamMap = await preloadIdMap(
    deps.db,
    "esport_teams",
    players.map((p) => p.current_team?.id).filter(isNumber),
  );
  const result = await upsertRows(
    deps,
    "esport_players",
    "player",
    players.map((p) => mapPlayer(p, teamMap)),
  );
  await reconcileTeamHistory(deps, players, teamMap);
  return result;
}

export async function ingestMatches(
  deps: IngestDeps,
  matches: PandaScoreMatch[],
): Promise<IngestResult> {
  if (matches.length === 0) return { ...EMPTY_RESULT };
  const tournamentPandaIds = matches.map((m) => m.tournament_id).filter(isNumber);
  const teamPandaIds = matches
    .flatMap((m) => [
      m.opponents[0]?.opponent?.id,
      m.opponents[1]?.opponent?.id,
      m.winner_id,
    ])
    .filter(isNumber);

  const [tournamentMap, teamMap] = await Promise.all([
    preloadIdMap(deps.db, "esport_tournaments", tournamentPandaIds),
    preloadIdMap(deps.db, "esport_teams", teamPandaIds),
  ]);

  const result = await upsertRows(
    deps,
    "esport_matches",
    "match",
    matches.map((m) => mapMatch(m, tournamentMap, teamMap)),
  );
  await settleFinishedMatches(deps, matches);
  return result;
}
