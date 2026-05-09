/**
 * Per-entity page processor for the full-sync chunked flow.
 *
 * Each call fetches ONE page from the matching PandaScore list endpoint,
 * resolves any FKs it references, and bulk-upserts the rows. Returns
 * `{ pageItems, failed, synced, errors }` so the caller can advance the
 * cursor:
 *   - if `failed` is true → keep cursor on the same page (will be retried
 *     by the next chunk)
 *   - else if pageItems < per_page → entity is done
 *   - else → bump page by 1 and continue
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import {
  getPastMatches,
  getPlayers,
  getRunningMatches,
  getRunningTournaments,
  getTeams,
  getUpcomingTournaments,
} from "../../_shared/pandascore/client.ts";
import {
  bulkUpsert,
  fetchOnePage,
  preloadIdMap,
  type SyncErrorCollector,
} from "../../_shared/pandascore/helpers.ts";
import {
  mapMatch,
  mapPlayer,
  mapTeam,
  mapTournament,
} from "../../_shared/pandascore/mappers.ts";
import type {
  PandaScoreMatch,
  PandaScorePlayer,
  PandaScoreTeam,
  PandaScoreTournament,
} from "../../_shared/pandascore/types.ts";
import type { SyncEntity } from "../lib/job-cursor.ts";

const PER_PAGE = 100;

export interface PageResult {
  /** Items returned by PandaScore for the page. < PER_PAGE means done IF !failed. */
  pageItems: number;
  /** True when the fetch threw (network / 5xx / timeout). The cursor must
   *  NOT advance on a failed fetch — a subsequent chunk should retry the
   *  same page rather than mark the entity prematurely done. */
  failed: boolean;
  synced: number;
  errors: number;
}

export async function processEntityPage(
  supabase: SupabaseClient,
  entity: SyncEntity,
  page: number,
  game: string | null,
  errors: SyncErrorCollector,
): Promise<PageResult> {
  switch (entity) {
    case "teams":
      return processTeamsPage(supabase, page, game, errors);
    case "tournaments":
      return processTournamentsPage(supabase, page, game, errors);
    case "players":
      return processPlayersPage(supabase, page, game, errors);
    case "matches":
      return processMatchesPage(supabase, page, game, errors);
  }
}

async function processTeamsPage(
  supabase: SupabaseClient,
  page: number,
  game: string | null,
  errors: SyncErrorCollector,
): Promise<PageResult> {
  const fetched = await fetchOnePage<PandaScoreTeam>(getTeams, {
    page,
    perPage: PER_PAGE,
    game: game ?? undefined,
    label: `teams-p${page}`,
    errorCollector: errors,
    errorType: "team",
  });
  const rows = fetched.items.map(mapTeam);
  const result = await bulkUpsert(supabase, "esport_teams", rows, "pandascore_id", {
    errorCollector: errors,
    errorType: "team",
  });
  return {
    pageItems: fetched.items.length,
    failed: fetched.failed,
    synced: result.synced,
    errors: result.errors,
  };
}

async function processTournamentsPage(
  supabase: SupabaseClient,
  page: number,
  game: string | null,
  errors: SyncErrorCollector,
): Promise<PageResult> {
  // PandaScore /tournaments/upcoming + /tournaments/running interleaved by
  // page. To stay simple and chunk-friendly, alternate within the cursor:
  // odd pages fetch upcoming, even pages fetch running. Both endpoints are
  // small enough (typically <500 rows total) to converge quickly.
  const fetcher = page % 2 === 1 ? getUpcomingTournaments : getRunningTournaments;
  const realPage = Math.ceil(page / 2);

  const fetched = await fetchOnePage<PandaScoreTournament>(fetcher, {
    page: realPage,
    perPage: PER_PAGE,
    game: game ?? undefined,
    label: `tournaments-${page % 2 === 1 ? "upcoming" : "running"}-p${realPage}`,
    errorCollector: errors,
    errorType: "tournament",
  });
  const rows = fetched.items.map(mapTournament);
  const result = await bulkUpsert(supabase, "esport_tournaments", rows, "pandascore_id", {
    errorCollector: errors,
    errorType: "tournament",
  });
  return {
    pageItems: fetched.items.length,
    failed: fetched.failed,
    synced: result.synced,
    errors: result.errors,
  };
}

async function processPlayersPage(
  supabase: SupabaseClient,
  page: number,
  game: string | null,
  errors: SyncErrorCollector,
): Promise<PageResult> {
  const fetched = await fetchOnePage<PandaScorePlayer>(getPlayers, {
    page,
    perPage: PER_PAGE,
    game: game ?? undefined,
    label: `players-p${page}`,
    errorCollector: errors,
    errorType: "player",
  });

  const teamPandaIds = fetched.items
    .map((p) => p.current_team?.id)
    .filter((id): id is number => typeof id === "number");
  const teamMap = await preloadIdMap(supabase, "esport_teams", teamPandaIds);

  const rows = fetched.items.map((p) => mapPlayer(p, teamMap));
  const result = await bulkUpsert(supabase, "esport_players", rows, "pandascore_id", {
    errorCollector: errors,
    errorType: "player",
  });
  return {
    pageItems: fetched.items.length,
    failed: fetched.failed,
    synced: result.synced,
    errors: result.errors,
  };
}

async function processMatchesPage(
  supabase: SupabaseClient,
  page: number,
  game: string | null,
  errors: SyncErrorCollector,
): Promise<PageResult> {
  // Like tournaments: alternate between past and running. Past dominates
  // by far, but the alternation ensures running matches stay fresh through
  // a long-running global sync.
  const fetcher = page % 2 === 1 ? getPastMatches : getRunningMatches;
  const realPage = Math.ceil(page / 2);

  const fetched = await fetchOnePage<PandaScoreMatch>(fetcher, {
    page: realPage,
    perPage: PER_PAGE,
    game: game ?? undefined,
    label: `matches-${page % 2 === 1 ? "past" : "running"}-p${realPage}`,
    errorCollector: errors,
    errorType: "match",
  });

  const tournamentPandaIds = fetched.items
    .map((m) => m.tournament_id)
    .filter((id): id is number => typeof id === "number");
  const teamPandaIds = fetched.items
    .flatMap((m) => [
      m.opponents[0]?.opponent?.id,
      m.opponents[1]?.opponent?.id,
      m.winner_id,
    ])
    .filter((id): id is number => typeof id === "number");

  const [tournamentMap, teamMap] = await Promise.all([
    preloadIdMap(supabase, "esport_tournaments", tournamentPandaIds),
    preloadIdMap(supabase, "esport_teams", teamPandaIds),
  ]);

  const rows = fetched.items.map((m) => mapMatch(m, tournamentMap, teamMap));
  const result = await bulkUpsert(supabase, "esport_matches", rows, "pandascore_id", {
    errorCollector: errors,
    errorType: "match",
  });
  return {
    pageItems: fetched.items.length,
    failed: fetched.failed,
    synced: result.synced,
    errors: result.errors,
  };
}
