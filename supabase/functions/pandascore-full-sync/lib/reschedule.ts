/**
 * Self-rescheduling helper for the full-sync flow.
 *
 * When a chunk runs out of time budget but the cursor isn't done yet, we
 * leave the row as `pending` (status update on Database Webhook UI will
 * re-fire the function). We also POST directly to ourselves so the next
 * chunk starts immediately rather than waiting on the Webhook UI fanout.
 *
 * The fire-and-forget request uses the function's own URL with the
 * service-role bearer.
 */

import { logger } from "../../_shared/logger.ts";

function getSelfUrl(): string | null {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) {
    logger.warn("SUPABASE_URL not set, can't self-reschedule");
    return null;
  }
  return `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/pandascore-full-sync`;
}

export async function rescheduleNextChunk(jobId: string): Promise<void> {
  const url = getSelfUrl();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return;

  // Fire-and-forget: don't await the response, but trap any synchronous
  // exception (e.g. invalid URL) so the caller never throws.
  try {
    fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ jobId }),
    }).catch((error) => {
      logger.warn("rescheduleNextChunk: fetch error", {
        jobId,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  } catch (error) {
    logger.warn("rescheduleNextChunk: sync error", { jobId, error });
  }
}
