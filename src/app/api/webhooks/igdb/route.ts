/**
 * IGDB Webhook Receiver — DECOMMISSIONED
 *
 * This route used to receive IGDB webhooks. Webhook reception has been
 * migrated to a Supabase Edge Function:
 *
 *   POST https://<project-ref>.supabase.co/functions/v1/igdb-webhook
 *
 * The route is kept temporarily as a kill switch so that any straggler
 * webhook still pointing at the old URL gets a clean error response
 * instead of being silently lost. Once all IGDB registrations have been
 * recreated against the Edge Function URL, this file can be deleted.
 *
 * Anything that was previously imported in this file (igdbWebhookService,
 * webhookDiffApplier, etc.) now lives in supabase/functions/_shared/.
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export function POST(request: Request) {
  // Best-effort logging so we know which webhooks are still hitting the old endpoint.
  const url = new URL(request.url);
  logger.warn("Legacy IGDB webhook endpoint hit — registration must be recreated", {
    entity: url.searchParams.get("entity"),
    method: url.searchParams.get("method"),
  });

  return NextResponse.json(
    {
      error:
        "This webhook endpoint has been decommissioned. Webhook reception is now handled by the Supabase Edge Function at /functions/v1/igdb-webhook. Re-register the webhook against the new URL.",
    },
    { status: 410 }
  );
}
