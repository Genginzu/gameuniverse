/**
 * Admin API: Apply webhook update diff to local game data.
 * POST /api/admin/webhooks/events/[eventId]/apply
 *
 * Body: { forceFields?: string[] }
 * - forceFields: field names to apply even if admin has overridden them
 * - Fields without admin overrides are applied automatically
 */

import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { logger } from "@/lib/logger";
import { applyWebhookPayload } from "@/lib/services/webhookDiffApplier";
import type { ApplyDiffRequest, ApplyDiffResult } from "@/types/webhook-diff";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { eventId } = await params;
    const body = (await request.json()) as ApplyDiffRequest;
    const forceFields = new Set(body.forceFields ?? []);

    const supabase = await createRouteHandlerClient();

    // Fetch the webhook event
    const { data: event, error: eventError } = await supabase
      .from("igdb_webhook_events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.event_type !== "update" || !event.game_id) {
      return NextResponse.json(
        { error: "Can only apply update events with a linked game" },
        { status: 400 }
      );
    }

    const gameId = event.game_id as string;
    const payload = event.payload as Record<string, unknown>;

    const result = await applyWebhookPayload(supabase, {
      gameId,
      payload,
      forceFields,
    });

    if (result.error) {
      return NextResponse.json(
        { error: `Failed to update game: ${result.error}` },
        { status: 500 }
      );
    }

    // Mark event as processed
    await supabase
      .from("igdb_webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("id", eventId);

    const response: ApplyDiffResult = {
      success: true,
      appliedFields: result.appliedFields,
      skippedFields: result.skippedFields,
    };

    logger.info("Webhook diff applied by admin", {
      eventId,
      gameId,
      applied: result.appliedFields,
      skipped: result.skippedFields,
    });
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    logger.error("Webhook apply error", { error });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
