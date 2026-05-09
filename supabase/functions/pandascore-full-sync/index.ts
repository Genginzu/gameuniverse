/**
 * PandaScore full sync — Supabase Edge Function (chunked, self-rescheduling).
 *
 * Endpoint:
 *   POST /functions/v1/pandascore-full-sync
 *
 * Body:
 *   { "jobId": "<uuid>" }     — from admin route or self-reschedule
 *
 * Triggers:
 *   1. /api/admin/esport/full-sync (Vercel) POSTs here right after
 *      inserting the job row.
 *   2. The function POSTs back to itself (lib/reschedule.ts) to start
 *      the next chunk after persisting cursor + status='pending'.
 *
 * Behaviour:
 *   - Atomically claims the job (status pending → running).
 *   - Loops: fetch one page from one entity, upsert, advance cursor.
 *   - Stops the loop when the time budget (CHUNK_BUDGET_MS) is nearly
 *     exhausted, OR when the cursor is fully done.
 *   - On budget exit: persists cursor, sets status back to `pending`,
 *     and self-reschedules so the next chunk starts immediately.
 *   - On completion: marks the job `completed`.
 *
 * Order: teams → tournaments → players → matches (FK-safe).
 */

import { logger } from "../_shared/logger.ts";
import { getSupabaseAdmin } from "../_shared/supabase-admin.ts";
import { SyncErrorCollector } from "../_shared/pandascore/helpers.ts";
import {
  claimJob,
  ensureCursor,
  isCursorComplete,
  markJobCompleted,
  markJobFailed,
  markJobPending,
  persistJobProgress,
  SYNC_ENTITIES,
  type JobRow,
  type SyncEntity,
} from "./lib/job-cursor.ts";
import { rescheduleNextChunk } from "./lib/reschedule.ts";
import { processEntityPage } from "./handlers/process-page.ts";

interface RequestBody {
  jobId?: string;
  record?: { id?: string };
}

/** Hard budget per chunk. Leaves ~50s margin under Edge's 400s wall clock. */
const CHUNK_BUDGET_MS = 350_000;

/** Per-call safety cap on pages processed in one chunk. Prevents accidental
 *  ultra-fast loops if PandaScore returns empty pages. */
const MAX_PAGES_PER_CHUNK = 200;

/** How often to persist the cursor + counters during a chunk. Smaller =
 *  smoother UI feedback but more DB writes. With ~5 pages/s, every 5
 *  pages = ~1 write/s, plenty for a 2s SWR poll. */
const PERSIST_EVERY_N_PAGES = 5;

/** Min delay between two PandaScore page fetches in a single chunk.
 *  PandaScore's published rate limit is ~4 req/s on standard plans;
 *  we keep ourselves at 5 req/s max (200ms) to leave headroom for the
 *  incremental cron that runs alongside. */
const MIN_DELAY_BETWEEN_PAGES_MS = 200;

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

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const jobId = body.jobId ?? body.record?.id;
  if (!jobId) {
    return jsonResponse({ error: "Missing jobId" }, 400);
  }

  const supabase = getSupabaseAdmin();
  const start = Date.now();

  // Atomically claim the job. If we can't claim it, another invocation is
  // processing this same chunk (or the job is in a terminal state).
  const job = await claimJob(supabase, jobId);
  if (!job) {
    logger.info("pandascore-full-sync: could not claim job", { jobId });
    return jsonResponse({ ok: true, skipped: true, reason: "not_claimable" });
  }

  const cursor = ensureCursor(job.cursor);
  const errors = new SyncErrorCollector();
  // Inherit prior error_details so we keep history across chunks.
  for (const e of job.error_details) errors.add(e);

  let totalSyncedDelta = 0;
  let totalErrorsDelta = 0;
  let pagesThisChunk = 0;

  try {
    while (pagesThisChunk < MAX_PAGES_PER_CHUNK) {
      // Time budget check at every page.
      if (Date.now() - start >= CHUNK_BUDGET_MS) {
        logger.info("pandascore-full-sync: chunk budget reached", {
          jobId,
          pagesThisChunk,
          elapsed: Date.now() - start,
        });
        break;
      }

      // Pick the next entity that isn't done. Order matters for FK.
      const entity = pickNextEntity(cursor);
      if (!entity) break; // all done

      const pageStartedAt = Date.now();
      const page = cursor[entity].page;
      const result = await processEntityPage(
        supabase,
        entity,
        page,
        job.game,
        errors,
      );

      totalSyncedDelta += result.synced;
      totalErrorsDelta += result.errors;
      pagesThisChunk++;

      // Advance cursor unless the fetch failed: a failed page must be
      // retried by the next chunk (e.g. transient PandaScore 5xx). A
      // legitimate short page (< 100) means end-of-data → entity done.
      if (result.failed) {
        // Inspect the latest collector entry to decide between two
        // failure modes:
        //   - 429 rate limit  -> hard fail the job. Looping on the same
        //     page only wastes more quota; the admin must wait or
        //     upgrade the plan.
        //   - other (network, 5xx) -> break the chunk and let the
        //     watchdog retry after the cooldown.
        const lastError = errors.toJSON().slice(-1)[0]?.error ?? "";
        const isRateLimit = lastError.includes("429");
        logger.warn("pandascore-full-sync: page failed", {
          jobId,
          entity,
          page,
          isRateLimit,
          lastError,
        });
        if (isRateLimit) {
          // Persist what we have so the cursor reflects the last
          // successfully fetched page, then mark failed.
          await persistJobProgress(supabase, {
            jobId,
            cursor,
            totalSyncedDelta,
            totalErrorsDelta,
            errorDetails: errors.toJSON(),
          });
          await markJobFailed(
            supabase,
            jobId,
            `Rate limit PandaScore atteint sur ${entity} page ${page}. La synchronisation est interrompue. Réessayez dans quelques minutes ou contactez PandaScore pour augmenter votre quota.`,
          );
          return jsonResponse({
            ok: false,
            jobId,
            failed: true,
            reason: "rate_limit",
            chunkSynced: totalSyncedDelta,
            chunkErrors: totalErrorsDelta,
            pagesThisChunk,
          });
        }
        // Non-rate-limit failure: break the chunk so the watchdog
        // retries after the cooldown.
        break;
      } else if (result.pageItems < 100) {
        cursor[entity].done = true;
        logger.info("pandascore-full-sync: entity done", {
          jobId,
          entity,
          pages: page,
        });
      } else {
        cursor[entity].page = page + 1;
      }

      // Persist intermediate progress every PERSIST_EVERY_N_PAGES so the
      // admin UI sees the cursor advance during a long chunk, not just
      // at chunk boundaries. We pass the running delta and reset it
      // after persisting so we don't double-count.
      if (pagesThisChunk % PERSIST_EVERY_N_PAGES === 0) {
        await persistJobProgress(supabase, {
          jobId,
          cursor,
          totalSyncedDelta,
          totalErrorsDelta,
          errorDetails: errors.toJSON(),
        });
        totalSyncedDelta = 0;
        totalErrorsDelta = 0;
      }

      // Throttle between pages so we never exceed PandaScore's rate
      // limit on a fast chunk. The fetch already includes 429 backoff,
      // but a proactive delay prevents hitting the limit in the first
      // place and avoids burning retry budget.
      const elapsed = Date.now() - pageStartedAt;
      if (elapsed < MIN_DELAY_BETWEEN_PAGES_MS) {
        await new Promise((r) => setTimeout(r, MIN_DELAY_BETWEEN_PAGES_MS - elapsed));
      }
    }

    // Persist any remaining delta + the final cursor state.
    await persistJobProgress(supabase, {
      jobId,
      cursor,
      totalSyncedDelta,
      totalErrorsDelta,
      errorDetails: errors.toJSON(),
    });

    if (isCursorComplete(cursor)) {
      await markJobCompleted(supabase, jobId);
      logger.info("pandascore-full-sync: job completed", {
        jobId,
        totalSynced: job.total_synced + totalSyncedDelta,
        totalErrors: job.total_errors + totalErrorsDelta,
      });
      return jsonResponse({
        ok: true,
        jobId,
        completed: true,
        chunkSynced: totalSyncedDelta,
        chunkErrors: totalErrorsDelta,
        pagesThisChunk,
      });
    }

    // Not done: reset to pending and self-reschedule.
    await markJobPending(supabase, jobId);
    await rescheduleNextChunk(jobId);
    return jsonResponse({
      ok: true,
      jobId,
      completed: false,
      chunkSynced: totalSyncedDelta,
      chunkErrors: totalErrorsDelta,
      pagesThisChunk,
      cursor,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("pandascore-full-sync: chunk failed", { jobId, error });

    // Persist any progress we made before the error.
    await persistJobProgress(supabase, {
      jobId,
      cursor,
      totalSyncedDelta,
      totalErrorsDelta,
      errorDetails: errors.toJSON(),
    }).catch(() => {});

    await markJobFailed(supabase, jobId, message);
    return jsonResponse({ ok: false, error: message }, 500);
  }
});

function pickNextEntity(
  cursor: Record<SyncEntity, { page: number; done: boolean }>,
): SyncEntity | null {
  for (const e of SYNC_ENTITIES) {
    if (!cursor[e].done) return e;
  }
  return null;
}
