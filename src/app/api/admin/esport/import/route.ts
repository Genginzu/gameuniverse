/**
 * PandaScore admin import (SSE stream) — DECOMMISSIONED
 *
 * This route used to stream a full PandaScore sync to the admin UI via
 * Server-Sent Events. It has been replaced by:
 *
 *   - POST /api/admin/esport/full-sync     → inserts a sync job row
 *   - GET  /api/admin/esport/sync-jobs     → polled by the admin UI
 *   - Supabase Edge Function pandascore-full-sync processes the job in
 *     chunks (≤350s each) and self-reschedules until completion.
 *
 * The previous SSE stream couldn't survive a full sync of 100k+ entities
 * within Vercel's function timeout. The new flow runs entirely on Supabase
 * Edge Functions (free tier compatible) and the UI watches progress via
 * SWR polling on the jobs table.
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export function POST() {
  logger.warn("Legacy /api/admin/esport/import hit — replaced by /api/admin/esport/full-sync");
  return NextResponse.json(
    {
      error:
        "This route has been decommissioned. Use POST /api/admin/esport/full-sync to enqueue a sync job and poll GET /api/admin/esport/sync-jobs for progress.",
    },
    { status: 410 },
  );
}
