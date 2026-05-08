/**
 * IGDB Webhook Receiver — Supabase Edge Function.
 *
 * Endpoint:
 *   POST /functions/v1/igdb-webhook?entity={games|characters|popularity_primitives}&method={create|update|delete}
 *
 * Responsibilities:
 *   1. Validate the X-Secret header against IGDB_WEBHOOK_SECRET
 *   2. Validate query params and payload shape
 *   3. Insert the event into igdb_webhook_events with status='received'
 *   4. Return 200 within seconds — IGDB deactivates webhooks after
 *      5 consecutive failures
 *
 * Processing happens asynchronously: a Database Webhook on
 * igdb_webhook_events (status='received') triggers the igdb-processor
 * Edge Function for actual import / diff / popularity logic.
 *
 * The receiver intentionally does NO heavy work to keep response time low.
 */

import { logger } from "../_shared/logger.ts";
import { getSupabaseAdmin } from "../_shared/supabase-admin.ts";
import {
  IGDB_ENTITY_TYPES,
  type WebhookEventType,
} from "../_shared/igdb-types.ts";

const VALID_METHODS: WebhookEventType[] = ["create", "update", "delete"];

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

  // Validate secret first to reject unauthorized callers fast.
  const expectedSecret = Deno.env.get("IGDB_WEBHOOK_SECRET");
  if (!expectedSecret) {
    logger.error("IGDB_WEBHOOK_SECRET not configured");
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  const secret = req.headers.get("x-secret");
  if (secret !== expectedSecret) {
    logger.warn("Webhook: invalid secret", { received: secret?.slice(0, 4) });
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const url = new URL(req.url);
    const entityType = url.searchParams.get("entity");
    const method = url.searchParams.get("method") as WebhookEventType | null;

    if (
      !entityType ||
      !IGDB_ENTITY_TYPES.includes(entityType as (typeof IGDB_ENTITY_TYPES)[number])
    ) {
      return jsonResponse({ error: "Invalid entity type" }, 400);
    }
    if (!method || !VALID_METHODS.includes(method)) {
      return jsonResponse({ error: "Invalid method" }, 400);
    }

    const payload = await req.json();
    if (!payload || typeof payload.id !== "number") {
      return jsonResponse({ error: "Invalid payload: missing id" }, 400);
    }

    const supabase = getSupabaseAdmin();

    const { data: event, error } = await supabase
      .from("igdb_webhook_events")
      .insert({
        event_type: method,
        entity_type: entityType,
        igdb_id: payload.id,
        payload,
        status: "received",
      })
      .select("id")
      .single();

    if (error) {
      logger.error("Failed to insert webhook event", { error, entityType, method });
      // Always return 200 so IGDB doesn't disable the webhook on transient errors.
      return jsonResponse({ ok: false, error: "Insert failed" }, 200);
    }

    logger.info("Webhook received", {
      entityType,
      method,
      igdbId: payload.id,
      eventId: event.id,
    });

    return jsonResponse({ ok: true, eventId: event.id }, 200);
  } catch (error) {
    logger.error("Webhook receiver error", { error });
    return jsonResponse({ ok: false }, 200);
  }
});
