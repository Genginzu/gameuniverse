/**
 * PandaScore full sync — Supabase Edge Function (chunked, self-rescheduling).
 *
 * Endpoint:
 *   POST /functions/v1/pandascore-full-sync
 *
 * Body:
 *   { "jobId": "<uuid>" }     — from admin route or self-reschedule
 *   { "record": { "id": ... } } — from Database Webhook UI on
 *                                  pandascore_sync_jobs INSERT/UPDATE
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

      // Advance cursor: if PandaScore returned a partial page, this entity
      // is done.
      if (result.pageItems < 100) {
        cursor[entity].done = true;
        logger.info("pandascore-full-sync: entity done", {
          jobId,
          entity,
          pages: page,
        });
      } else {
        cursor[entity].page = page + 1;
      }
    }

    // Persist progress whatever the exit reason.
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
    rescheduleNextChunk(jobId);
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
