/**
 * Admin API: Manage IGDB webhook registrations
 * GET  /api/admin/webhooks/registrations — list all registered webhooks
 * POST /api/admin/webhooks/registrations — register a new webhook
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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL;

    if (!webhookSecret || !siteUrl) {
      return NextResponse.json(
        { error: "IGDB_WEBHOOK_SECRET or NEXT_PUBLIC_SITE_URL not configured" },
        { status: 500 }
      );
    }

    const webhookUrl = `${siteUrl}/api/webhooks/igdb?entity=${endpoint}&method=${method}`;

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

      // IGDB rejects localhost/non-public URLs with 403
      const isLocalUrl = webhookUrl.includes("localhost") || webhookUrl.includes("127.0.0.1");
      if (response.status === 403 && isLocalUrl) {
        return NextResponse.json(
          {
            error:
              "IGDB rejects localhost URLs. Use a public URL or a tunnel (ngrok, cloudflared).",
          },
          { status: 422 }
        );
      }

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
