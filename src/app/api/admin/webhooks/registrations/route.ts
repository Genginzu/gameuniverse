/**
 * Admin API: Manage IGDB webhook registrations
 * GET  /api/admin/webhooks/registrations — list all registered webhooks
 * POST /api/admin/webhooks/registrations — register a new webhook
 *
 * Webhooks now point to the Supabase Edge Function `igdb-webhook`
 * instead of the previous Vercel route. The URL is built from
 * NEXT_PUBLIC_SUPABASE_URL.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { defineRoute, validationError } from "@/lib/api/route";
import { IGDBService } from "@/lib/services/igdbService";
import { logger } from "@/lib/logger";
import { IGDB_ENDPOINTS, type WebhookEventType } from "@/types/webhooks";

const VALID_METHODS: WebhookEventType[] = ["create", "update", "delete"];

const registerBodySchema = z.object({
  endpoint: z.string().optional(),
  method: z.string().optional(),
});

export const GET = defineRoute({ auth: "admin" }, async () => {
  const token = await IGDBService.getAccessToken();
  const clientId = process.env.IGDB_CLIENT_ID!;

  const response = await fetch("https://api.igdb.com/v4/webhooks/", {
    method: "GET",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    logger.error("Failed to list IGDB webhooks", { status: response.status, body: text });
    return NextResponse.json({ error: "Failed to list webhooks from IGDB" }, { status: 502 });
  }

  const webhooks = await response.json();
  return NextResponse.json({ webhooks });
});

export const POST = defineRoute({ auth: "admin", body: registerBodySchema }, async ({ body }) => {
  const { endpoint, method } = body;

  if (!endpoint || !IGDB_ENDPOINTS.includes(endpoint as (typeof IGDB_ENDPOINTS)[number])) {
    throw validationError(undefined, "Invalid endpoint");
  }
  if (!method || !VALID_METHODS.includes(method as WebhookEventType)) {
    throw validationError(undefined, "Invalid method");
  }

  const webhookSecret = process.env.IGDB_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!webhookSecret || !supabaseUrl) {
    return NextResponse.json(
      { error: "IGDB_WEBHOOK_SECRET or NEXT_PUBLIC_SUPABASE_URL not configured" },
      { status: 500 }
    );
  }

  const webhookUrl = `${supabaseUrl}/functions/v1/igdb-webhook?entity=${endpoint}&method=${method}`;

  // Force a fresh token — cached tokens may be stale for webhook operations
  IGDBService.clearTokenCache();
  const token = await IGDBService.getAccessToken();
  const clientId = process.env.IGDB_CLIENT_ID!;

  const response = await fetch(`https://api.igdb.com/v4/${endpoint}/webhooks/`, {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      url: webhookUrl,
      secret: webhookSecret,
      method,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    logger.error("Failed to register IGDB webhook", { status: response.status, body: text });
    return NextResponse.json({ error: "Failed to register webhook with IGDB" }, { status: 502 });
  }

  const webhook = await response.json();
  logger.info("IGDB webhook registered", { endpoint, method, webhookId: webhook.id });

  return NextResponse.json({ webhook }, { status: 201 });
});
