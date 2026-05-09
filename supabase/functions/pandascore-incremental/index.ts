/**
 * PandaScore incremental sync — Supabase Edge Function.
 *
 * Endpoint:
 *   POST /functions/v1/pandascore-incremental
 *
 * Triggers:
 *   1. pg_cron every 5 minutes (default authenticated invocation)
 *   2. Vercel admin route /api/admin/esport/incremental-sync (proxy)
 *
 * Behaviour:
 *   - Acquires an applicative lock on pandascore_sync_state (auto-released
 *     after 6 minutes if a previous run crashed).
 *   - Reads the `since` cursor from pandascore_sync_state.last_incremental_at.
 *     On first run (NULL), uses a 24-hour default window so we don't pull
 *     everything.
 *   - Calls /additions, /changes, /deletions in parallel with `since` and
 *     paginates up to MAX_INCIDENTS_PER_TYPE per category.
 *   - Dispatches to sync-by-ids handlers for upsert; bulk-deletes for
 *     deletions. Order: teams → tournaments → players → matches (FK order).
 *   - Writes a pandascore_sync_logs row for audit.
 *   - Advances the cursor to `now()` on success only. On failure, leaves
 *     the cursor untouched so the next run retries the same delta.
 *
 * Returns 200 with a JSON body so callers (cron pg_net, admin route) can
 * surface the result. The response contains `{ ok, skipped?, results, since }`.
 */

import { logger } from "../_shared/logger.ts";
import { getSupabaseAdmin } from "../_shared/supabase-admin.ts";
import {
  getAdditions,
  getChanges,
  getDeletions,
} from "../_shared/pandascore/client.ts";
import {
  fetchAllPages,
  SyncErrorCollector,
} from "../_shared/pandascore/helpers.ts";
import type {
  PandaScoreIncident,
  PandaScoreListParams,
} from "../_shared/pandascore/types.ts";
import { acquireLock, releaseLock } from "./lib/lock.ts";
import {
  completeLogEntry,
  createLogEntry,
  failLogEntry,
  type SyncCounts,
} from "./lib/log-entry.ts";
import {
  deleteByPandaIds,
  syncMatchesByIds,
  syncPlayersByIds,
  syncTeamsByIds,
  syncTournamentsByIds,
} from "./handlers/sync-by-ids.ts";

const ENTITY_TYPES = ["team", "player", "tournament", "match"] as const;
type EntityType = (typeof ENTITY_TYPES)[number];

const TABLE_MAP: Record<EntityType, string> = {
  team: "esport_teams",
  player: "esport_players",
  tournament: "esport_tournaments",
  match: "esport_matches",
};

/** Cap per category. 5 minutes of delta is normally < 100 incidents.
 *  500 leaves comfortable headroom for catch-up after a few missed cron
 *  ticks, while keeping total runtime well under 400s. */
const MAX_INCIDENTS_PER_TYPE = 500;

/** Pages of incidents to fetch per category (per_page=100). 10 pages =
 *  1000 incidents/category, more than enough between two 5-minute ticks. */
const INCIDENTS_MAX_PAGES = 10;

/** Default `since` window on first run (NULL cursor). 24 hours catches up
 *  recent activity without pulling the full backlog. */
const FIRST_RUN_WINDOW_MS = 24 * 60 * 60 * 1000;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabase = getSupabaseAdmin();
  const start = Date.now();

  // ── 1. Acquire applicative lock ────────────────────────────────────────
  const lock = await acquireLock(supabase);
  if (!lock.acquired) {
    logger.info("pandascore-incremental: lock held, skipping", {
      heldSince: lock.heldSince,
    });
    return jsonResponse({ ok: true, skipped: true, reason: "locked", heldSince: lock.heldSince, error: lock.error });
  }

  // The cursor used as the `since` parameter for PandaScore Incidents API.
  // On first run (NULL), use a 24h window. We must commit `now()` (not the
  // request time) at the end so we don't miss events that arrive while we run.
  const runStartedAt = new Date();
  const since =
    lock.since ??
    new Date(Date.now() - FIRST_RUN_WINDOW_MS).toISOString();

  // ── 2. Create audit log row ────────────────────────────────────────────
  // Trigger detection: cron jobs use pg_net which sends no special header.
  // Manual admin proxy adds `x-trigger: manual`.
  const trigger = req.headers.get("x-trigger") === "manual" ? "manual" : "cron";
  const logId = await createLogEntry(supabase, trigger);
  const errors = new SyncErrorCollector();

  const counts: SyncCounts = {
    teams: { synced: 0, errors: 0 },
    players: { synced: 0, errors: 0 },
    tournaments: { synced: 0, errors: 0 },
    matches: { synced: 0, errors: 0 },
  };

  try {
    // ── 3. Fetch incidents in parallel ───────────────────────────────────
    const baseParams: PandaScoreListParams = {
      since,
      type: ENTITY_TYPES.join(","),
    };

    const [additions, changes, deletions] = await Promise.all([
      fetchAllPages(getAdditions, {
        maxPages: INCIDENTS_MAX_PAGES,
        extra: baseParams as Record<string, string | number>,
        label: "additions",
        errorCollector: errors,
        errorType: "incidents",
      }),
      fetchAllPages(getChanges, {
        maxPages: INCIDENTS_MAX_PAGES,
        extra: baseParams as Record<string, string | number>,
        label: "changes",
        errorCollector: errors,
        errorType: "incidents",
      }),
      fetchAllPages(getDeletions, {
        maxPages: INCIDENTS_MAX_PAGES,
        extra: baseParams as Record<string, string | number>,
        label: "deletions",
        errorCollector: errors,
        errorType: "incidents",
      }),
    ]);

    logger.info("pandascore-incremental: incidents fetched", {
      since,
      additions: additions.length,
      changes: changes.length,
      deletions: deletions.length,
    });

    // ── 4. Group + dedupe upsert ids by entity type ──────────────────────
    const upsertIdsByType = new Map<EntityType, Set<number>>();
    for (const t of ENTITY_TYPES) upsertIdsByType.set(t, new Set());

    for (const incident of [...additions, ...changes]) {
      const type = incident.type as EntityType;
      if (ENTITY_TYPES.includes(type)) {
        upsertIdsByType.get(type)!.add(incident.id);
      }
    }

    const takeIds = (type: EntityType): number[] => {
      const all = Array.from(upsertIdsByType.get(type) ?? []);
      if (all.length > MAX_INCIDENTS_PER_TYPE) {
        logger.warn("Capping incidents", { type, total: all.length, cap: MAX_INCIDENTS_PER_TYPE });
        return all.slice(0, MAX_INCIDENTS_PER_TYPE);
      }
      return all;
    };

    // ── 5. Sync upserts in FK-safe order ─────────────────────────────────
    counts.teams = await syncTeamsByIds(supabase, takeIds("team"), errors);
    counts.tournaments = await syncTournamentsByIds(
      supabase,
      takeIds("tournament"),
      errors,
    );
    counts.players = await syncPlayersByIds(supabase, takeIds("player"), errors);
    counts.matches = await syncMatchesByIds(supabase, takeIds("match"), errors);

    // ── 6. Apply deletions (one query per table) ─────────────────────────
    const deletionsByType = new Map<EntityType, number[]>();
    for (const incident of deletions as PandaScoreIncident[]) {
      const type = incident.type as EntityType;
      if (ENTITY_TYPES.includes(type)) {
        const arr = deletionsByType.get(type) ?? [];
        arr.push(incident.id);
        deletionsByType.set(type, arr);
      }
    }
    for (const [type, ids] of deletionsByType) {
      const result = await deleteByPandaIds(
        supabase,
        TABLE_MAP[type],
        ids,
        errors,
        type,
      );
      const key = (type === "match" ? "matches" : `${type}s`) as keyof SyncCounts;
      counts[key].synced += result.synced;
      counts[key].errors += result.errors;
    }

    // ── 7. Persist log + release lock + advance cursor ───────────────────
    const durationMs = Date.now() - start;
    if (logId) {
      await completeLogEntry(supabase, logId, {
        counts,
        durationMs,
        errorDetails: errors.toJSON(),
      });
    }
    await releaseLock(supabase, { advanceCursorTo: runStartedAt.toISOString() });

    logger.info("pandascore-incremental: completed", {
      trigger,
      since,
      durationMs,
      counts,
      errorCount: errors.count,
    });

    return jsonResponse({
      ok: true,
      trigger,
      since,
      durationMs,
      results: counts,
      errors: errors.count,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("pandascore-incremental: failed", { error });

    const durationMs = Date.now() - start;
    if (logId) {
      await failLogEntry(supabase, logId, {
        errorMessage: message,
        durationMs,
        errorDetails: errors.toJSON(),
      });
    }
    // Release the lock but DO NOT advance the cursor: the next run will
    // re-process the same delta.
    await releaseLock(supabase, { advanceCursorTo: null });

    return jsonResponse({ ok: false, error: message }, 500);
  }
});
