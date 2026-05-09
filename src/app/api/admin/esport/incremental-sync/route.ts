/**
 * POST /api/admin/esport/incremental-sync
 *
 * Thin proxy that invokes the `pandascore-incremental` Supabase Edge
 * Function. The Edge Function handles the lock, the cursor, the fetch
 * and the upserts; this route just relays the request with the
 * service-role bearer and returns the response to the admin UI.
 *
 * Use cases:
 *   - Admin button "Sync incrémentale" (manual trigger)
 *   - Same Edge Function is invoked automatically by pg_cron every 5 min
 *
 * If the lock is already held by another invocation (cron or another
 * manual click), the Edge Function returns `{ skipped: true }` and we
 * relay it as-is.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured" },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(
      `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/pandascore-incremental`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
          "x-trigger": "manual",
        },
        body: "{}",
      },
    );

    const text = await response.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text.slice(0, 500) };
    }

    return NextResponse.json(body, { status: response.status });
  } catch (error) {
    logger.error("Failed to invoke pandascore-incremental Edge Function", { error });
    return NextResponse.json(
      { error: "Failed to invoke incremental sync" },
      { status: 502 },
    );
  }
}
