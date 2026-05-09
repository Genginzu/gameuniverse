/**
 * Self-rescheduling helper for the full-sync flow.
 *
 * When a chunk runs out of time budget but the cursor isn't done yet, we
 * leave the row as `pending` and POST back to ourselves with the jobId
 * so the next chunk starts immediately.
 *
 * Important: a naked `fetch()` would be cancelled when the Edge Function
 * handler returns. Supabase Edge Runtime exposes `EdgeRuntime.waitUntil`
 * (similar to Cloudflare Workers / Vercel Edge) which keeps the promise
 * alive past the response. We fall back to awaiting the fetch when
 * waitUntil isn't available so behaviour is consistent locally.
 */

import { logger } from "../../_shared/logger.ts";

declare const EdgeRuntime:
  | { waitUntil(promise: Promise<unknown>): void }
  | undefined;

function getSelfUrl(): string | null {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) {
    logger.warn("SUPABASE_URL not set, can't self-reschedule");
    return null;
  }
  return `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/pandascore-full-sync`;
}

/**
 * Returns once the rescheduling POST has been kicked off. The actual
 * HTTP roundtrip continues in the background via waitUntil.
 */
export async function rescheduleNextChunk(jobId: string): Promise<void> {
  const url = getSelfUrl();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return;

  const requestPromise = fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ jobId }),
  })
    .then((res) => {
      if (!res.ok) {
        logger.warn("rescheduleNextChunk: non-OK response", {
          jobId,
          status: res.status,
        });
      }
    })
    .catch((error) => {
      logger.warn("rescheduleNextChunk: fetch error", {
        jobId,
        error: error instanceof Error ? error.message : String(error),
      });
    });

  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
    EdgeRuntime.waitUntil(requestPromise);
    return;
  }

  // Fallback: await the fetch. Costs a few ms but guarantees the request
  // leaves before the handler completes.
  await requestPromise;
}
