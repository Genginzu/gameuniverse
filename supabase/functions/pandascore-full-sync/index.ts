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
 *     Jobs of kind='entity' only walk that entity's cursor keys.
 *   - Stops the loop when the time budget (CHUNK_BUDGET_MS) is nearly
 *     exhausted, when a page fails, OR when the cursor is fully done.
 *   - The typed failure reason of a failed page decides the outcome
 *     (sync-run/lifecycle.ts): rate limit / fatal → job failed,
 *     transient → persist and self-reschedule to retry the same page.
 *   - On completion: marks the job `completed`.
 *
 * Order: teams → tournaments → players → matches (FK-safe).
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { logger } from "../_shared/logger.ts";
import { getSupabaseAdmin } from "../_shared/supabase-admin.ts";
import { SyncErrorCollector } from "../_shared/pandascore/helpers.ts";
import {
  cursorKeysForJob,
  decideChunkOutcome,
  ensureCursor,
  isCursorComplete,
  pickNextEntity,
  type Cursor,
  type PageFailure,
  type SyncEntity,
} from "../_shared/pandascore/sync-run/index.ts";
import {
  claimJob,
  markJobCompleted,
  markJobFailed,
  markJobPending,
  persistJobProgress,
  type JobRow,
} from "./lib/job-store.ts";
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

const PER_PAGE = 100;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

class ChunkRun {
  readonly cursor: Cursor;
  readonly scope: readonly SyncEntity[];
  readonly errors: SyncErrorCollector;
  chunkSynced = 0;
  chunkErrors = 0;
  pages = 0;
  failure: PageFailure | null = null;
  private pendingSynced = 0;
  private pendingErrors = 0;

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly job: JobRow,
    private readonly startedAt: number,
  ) {
    this.cursor = ensureCursor(job.cursor);
    this.scope = cursorKeysForJob(job);
    this.errors = SyncErrorCollector.fromJSON(job.error_details);
  }

  async run(): Promise<void> {
    while (this.pages < MAX_PAGES_PER_CHUNK) {
      if (Date.now() - this.startedAt >= CHUNK_BUDGET_MS) {
        logger.info("pandascore-full-sync: chunk budget reached", {
          jobId: this.job.id,
          pagesThisChunk: this.pages,
          elapsed: Date.now() - this.startedAt,
        });
        return;
      }
      const entity = pickNextEntity(this.cursor, this.scope);
      if (!entity) return;
      const pageStartedAt = Date.now();
      await this.processPage(entity);
      if (this.failure) return;
      if (this.pages % PERSIST_EVERY_N_PAGES === 0) await this.flush();
      const elapsed = Date.now() - pageStartedAt;
      if (elapsed < MIN_DELAY_BETWEEN_PAGES_MS) {
        await new Promise((r) => setTimeout(r, MIN_DELAY_BETWEEN_PAGES_MS - elapsed));
      }
    }
  }

  async flush(): Promise<void> {
    await persistJobProgress(this.supabase, {
      jobId: this.job.id,
      cursor: this.cursor,
      syncedDelta: this.pendingSynced,
      errorsDelta: this.pendingErrors,
      errors: this.errors,
    });
    this.pendingSynced = 0;
    this.pendingErrors = 0;
  }

  get isComplete(): boolean {
    return isCursorComplete(this.cursor, this.scope);
  }

  private async processPage(entity: SyncEntity): Promise<void> {
    const page = this.cursor[entity].page;
    const result = await processEntityPage(this.supabase, entity, page, this.job.game, this.errors);
    this.pages++;
    this.chunkSynced += result.synced;
    this.chunkErrors += result.errors;
    this.pendingSynced += result.synced;
    this.pendingErrors += result.errors;

    if (result.failure) {
      this.failure = { reason: result.failure, entity, page };
      logger.warn("pandascore-full-sync: page failed", { jobId: this.job.id, ...this.failure });
    } else if (result.pageItems < PER_PAGE) {
      this.cursor[entity].done = true;
      logger.info("pandascore-full-sync: entity done", { jobId: this.job.id, entity, pages: page });
    } else {
      this.cursor[entity].page = page + 1;
    }
  }
}

async function finishChunk(supabase: SupabaseClient, chunk: ChunkRun, jobId: string): Promise<Response> {
  await chunk.flush();
  const outcome = decideChunkOutcome({ failure: chunk.failure, cursorComplete: chunk.isComplete });
  const stats = {
    jobId,
    chunkSynced: chunk.chunkSynced,
    chunkErrors: chunk.chunkErrors,
    pagesThisChunk: chunk.pages,
  };

  if (outcome.action === "fail") {
    await markJobFailed(supabase, jobId, outcome.message);
    return jsonResponse({ ok: false, failed: true, reason: outcome.reason, ...stats });
  }
  if (outcome.action === "complete") {
    await markJobCompleted(supabase, jobId);
    logger.info("pandascore-full-sync: job completed", stats);
    return jsonResponse({ ok: true, completed: true, ...stats });
  }
  await markJobPending(supabase, jobId);
  await rescheduleNextChunk(jobId);
  return jsonResponse({ ok: true, completed: false, cursor: chunk.cursor, ...stats });
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

  const chunk = new ChunkRun(supabase, job, start);
  try {
    await chunk.run();
    return await finishChunk(supabase, chunk, jobId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("pandascore-full-sync: chunk failed", { jobId, error });
    await chunk.flush().catch(() => {});
    await markJobFailed(supabase, jobId, message);
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
