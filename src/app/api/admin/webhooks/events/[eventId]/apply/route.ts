/**
 * Admin API: Apply webhook update diff to local game data.
 * POST /api/admin/webhooks/events/[eventId]/apply
 *
 * Body: { forceFields?: string[] }
 * - forceFields: field names to apply even if admin has overridden them
 * - Fields without admin overrides are applied automatically
 *
 * Implementation: this route delegates the actual work to the
 * Supabase Edge Function `igdb-processor` (with `force=true`). All
 * webhook processing now lives in Edge Functions; this route only
 * handles authentication and forwards the request.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { logger } from "@/lib/logger";
import type { ApplyDiffRequest, ApplyDiffResult } from "@/types/webhook-diff";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

interface ProcessorResponse {
  success?: boolean;
  appliedFields?: string[];
  skippedFields?: string[];
  error?: string;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { eventId } = await params;
    const body = (await request.json()) as ApplyDiffRequest;
    const forceFields = body.forceFields ?? [];

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      logger.error("Missing Supabase env vars for processor delegation");
      return NextResponse.json(
        { error: "Server misconfigured: Supabase URL or service role key missing" },
        { status: 500 }
      );
    }

    const processorUrl = `${supabaseUrl}/functions/v1/igdb-processor`;

    const response = await fetch(processorUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        eventId,
        force: true,
        forceFields,
      }),
    });

    const result = (await response.json().catch(() => null)) as ProcessorResponse | null;

    if (!response.ok || !result) {
      const errorMessage = result?.error ?? `Processor returned ${response.status}`;
      logger.error("Processor delegation failed", {
        eventId,
        status: response.status,
        error: errorMessage,
      });
      return NextResponse.json(
        { error: `Failed to apply diff: ${errorMessage}` },
        { status: 500 }
      );
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const apiResponse: ApplyDiffResult = {
      success: true,
      appliedFields: result.appliedFields ?? [],
      skippedFields: result.skippedFields ?? [],
    };

    logger.info("Webhook diff applied via Edge Function", {
      eventId,
      applied: apiResponse.appliedFields,
      skipped: apiResponse.skippedFields,
    });

    return NextResponse.json(apiResponse);
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    logger.error("Webhook apply route error", { error });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
