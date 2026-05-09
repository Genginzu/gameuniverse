/**
 * PandaScore esport sync — DECOMMISSIONED
 *
 * This Vercel cron route used to fetch and apply the incremental delta
 * via PandaScore Incidents API. It has been migrated to a Supabase Edge
 * Function invoked by pg_cron every 5 minutes:
 *
 *   POST https://<project-ref>.supabase.co/functions/v1/pandascore-incremental
 *
 * The route is kept temporarily as a kill switch so any external trigger
 * still pointing here gets a clean 410 instead of being silently lost.
 * Once the new cron has been verified in production for a few days, this
 * file (and the cron entry in vercel.json) can be deleted.
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

function handler() {
  logger.warn("Legacy /api/cron/esport-sync hit — moved to Supabase Edge Function");
  return NextResponse.json(
    {
      error:
        "This route has been decommissioned. Esport sync is now handled by the Supabase Edge Function /functions/v1/pandascore-incremental, scheduled via pg_cron every 5 minutes.",
    },
    { status: 410 },
  );
}

export const GET = handler;
export const POST = handler;
