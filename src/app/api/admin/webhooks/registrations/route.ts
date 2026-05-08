/**
 * Admin API: Manage IGDB webhook registrations
 * GET  /api/admin/webhooks/registrations — list all registered webhooks
 * POST /api/admin/webhooks/registrations — register a new webhook
 *
 * Webhooks now point to the Supabase Edge Function `igdb-webhook`
 * instead of the previous Vercel route. The URL is built from
 * NEXT_PUBLIC_SUPABASE_URL.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { IGDBService } from "@/lib/services/igdbService";
import { logger } from "@/lib/logger";
import { IGDB_ENDPOINTS, type WebhookEventType } from "@/types/webhooks";

const VALID_METHODS: WebhookEventType[] = ["create", "update", "delete"];

export async function GET() {
  try {
    await requireAdmin();

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
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    logger.error("List webhooks error", { error });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { endpoint, method } = body as { endpoint?: string; method?: string };

    if (!endpoint || !IGDB_ENDPOINTS.includes(endpoint as (typeof IGDB_ENDPOINTS)[number])) {
      return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
    }
    if (!method || !VALID_METHODS.includes(method as WebhookEventType)) {
      return NextResponse.json({ error: "Invalid method" }, { status: 400 });
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
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    logger.error("Register webhook error", { error });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
