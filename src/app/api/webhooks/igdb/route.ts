/**
 * IGDB Webhook Receiver
 *
 * POST /api/webhooks/igdb?entity={games|characters}&method={create|update|delete}
 *
 * IGDB sends a POST with the entity JSON in the body.
 * The X-Secret header is validated against IGDB_WEBHOOK_SECRET.
 * Must respond 200 within 15 seconds or IGDB will retry (5 failures = deactivation).
 */

import { NextRequest, NextResponse } from "next/server";
import { processWebhookEvent } from "@/lib/services/igdbWebhookService";
import { logger } from "@/lib/logger";
import type { WebhookEventType } from "@/types/webhooks";
import { IGDB_ENDPOINTS } from "@/types/webhooks";

const VALID_METHODS: WebhookEventType[] = ["create", "update", "delete"];

export async function POST(request: NextRequest) {
  try {
    // Validate secret
    const secret = request.headers.get("x-secret");
    const expectedSecret = process.env.IGDB_WEBHOOK_SECRET;

    if (!expectedSecret) {
      logger.error("IGDB_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    if (secret !== expectedSecret) {
      logger.warn("Webhook: invalid secret", { received: secret?.slice(0, 4) });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entity");
    const method = searchParams.get("method") as WebhookEventType | null;

    if (!entityType || !IGDB_ENDPOINTS.includes(entityType as (typeof IGDB_ENDPOINTS)[number])) {
      return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
    }
    if (!method || !VALID_METHODS.includes(method)) {
      return NextResponse.json({ error: "Invalid method" }, { status: 400 });
    }

    // Parse body
    const payload = await request.json();
    if (!payload || typeof payload.id !== "number") {
      return NextResponse.json({ error: "Invalid payload: missing id" }, { status: 400 });
    }

    logger.info("Webhook received", { entityType, method, igdbId: payload.id });

    // Process the event (non-blocking for create, synchronous logging for others)
    const result = await processWebhookEvent(entityType, method, payload);

    return NextResponse.json({ ok: true, eventId: result.eventId, status: result.status });
  } catch (error) {
    logger.error("Webhook processing error", { error });
    // Always return 200 to avoid IGDB deactivating the webhook on transient errors
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 200 });
  }
}
