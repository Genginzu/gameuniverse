/**
 * PandaScore admin sync — DECOMMISSIONED
 *
 * Replaced by:
 *   - POST /api/admin/esport/incremental-sync  → invokes the Edge Function
 *   - POST /api/admin/esport/full-sync         → enqueues a chunked job
 *
 * Reasons: the previous full sync was capped at ~2000 entities/endpoint to
 * fit within Vercel's serverless timeout, which silently truncated 90+%
 * of the matches table. The new Edge Functions flow has no such cap.
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export function POST() {
  logger.warn(
    "Legacy /api/admin/esport/sync hit — use /api/admin/esport/incremental-sync or /api/admin/esport/full-sync",
  );
  return NextResponse.json(
    {
      error:
        "This route has been decommissioned. Use /api/admin/esport/incremental-sync (delta) or /api/admin/esport/full-sync (full).",
    },
    { status: 410 },
  );
}
