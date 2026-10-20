/**
 * Per-entity page processor for the full-sync chunked flow.
 *
 * Each call fetches ONE page from a specific PandaScore list endpoint and
 * hands the items to the shared ingest module (FK resolution, upsert, side
 * effects). Returns `{ pageItems, failure, synced, errors }` so the caller
 * can advance the cursor:
 *   - if `failure` is set → keep cursor on the same page (retried by the
 *     next chunk, or the job fails, depending on the failure reason)
 *   - else if pageItems < per_page → entity is done
 *   - else → bump page by 1 and continue
 *
 * Each SyncEntity maps 1:1 to a PandaScore endpoint. No alternation
 * inside a single entity — entities that span two endpoints (matches
 * past/running, tournaments upcoming/running) get split into two
 * SyncEntity values in _shared/pandascore/sync-run/cursor.ts.
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
  fetchOnePage,
  type SyncErrorCollector,
} from "../../_shared/pandascore/helpers.ts";
import {
  ingestMatches,
  ingestPlayers,
  ingestTeams,
  ingestTournaments,
  type IngestDeps,
  type IngestResult,
} from "../../_shared/pandascore/ingest/index.ts";
import { createIngestDeps } from "../../_shared/pandascore/ingest-deps.ts";
import type { PandaScoreListParams } from "../../_shared/pandascore/types.ts";
import type { SyncEntity, SyncFailureReason } from "../../_shared/pandascore/sync-run/index.ts";

const PER_PAGE = 100;

export interface PageResult {
  /** Items returned by PandaScore for the page. < PER_PAGE means done IF no failure. */
  pageItems: number;
  /** Set when the fetch threw (rate limit / network / 5xx / timeout). The
   *  cursor must NOT advance on a failed fetch — a subsequent chunk should
   *  retry the same page rather than mark the entity prematurely done. */
  failure: SyncFailureReason | null;
  synced: number;
  errors: number;
}

type PageProcessor = (
  deps: IngestDeps,
  page: number,
  game: string | null,
) => Promise<PageResult>;

function pageSource<T>(
  label: string,
  errorType: string,
  fetcher: (params: PandaScoreListParams) => Promise<T[]>,
  ingest: (deps: IngestDeps, items: T[]) => Promise<IngestResult>,
): PageProcessor {
  return async (deps, page, game) => {
    const fetched = await fetchOnePage<T>(fetcher, {
      page,
      perPage: PER_PAGE,
      game: game ?? undefined,
      label: `${label}-p${page}`,
      errorCollector: deps.errors,
      errorType,
    });
    const result = await ingest(deps, fetched.items);
    return {
      pageItems: fetched.items.length,
      failure: fetched.failure,
      synced: result.synced,
      errors: result.errors,
    };
  };
}

const PAGE_PROCESSORS: Record<SyncEntity, PageProcessor> = {
  teams: pageSource("teams", "team", getTeams, ingestTeams),
  tournaments_upcoming: pageSource(
    "tournaments-upcoming",
    "tournament",
    getUpcomingTournaments,
    ingestTournaments,
  ),
  tournaments_running: pageSource(
    "tournaments-running",
    "tournament",
    getRunningTournaments,
    ingestTournaments,
  ),
  players: pageSource("players", "player", getPlayers, ingestPlayers),
  matches_past: pageSource("matches-past", "match", getPastMatches, ingestMatches),
  matches_running: pageSource(
    "matches-running",
    "match",
    getRunningMatches,
    ingestMatches,
  ),
};

export function processEntityPage(
  supabase: SupabaseClient,
  entity: SyncEntity,
  page: number,
  game: string | null,
  errors: SyncErrorCollector,
): Promise<PageResult> {
  return PAGE_PROCESSORS[entity](createIngestDeps(supabase, errors), page, game);
}
