/**
 * POST /api/internal/esport/reconcile-history
 *
 * Internal callback invoked by the `pandascore-incremental` and
 * `pandascore-full-sync` Edge Functions when player team changes need
 * to be persisted in `esport_player_team_history`.
 *
 * Authentication: shared secret in `x-edge-callback-secret` header,
 * validated against EDGE_CALLBACK_SECRET. This route is NOT exposed
 * to public traffic and not behind admin auth — it's a server-to-server
 * trust between Supabase and Vercel.
 */

import { NextRequest, NextResponse } from "next/server";
import { reconcilePlayerTeamHistory } from "@/lib/services/esport/playerTeamHistory";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface RequestBody {
  inputs?: Array<{ playerLocalId?: string; newTeamLocalId?: string | null }>;
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.EDGE_CALLBACK_SECRET;
  const providedSecret = request.headers.get("x-edge-callback-secret");

  if (!expectedSecret) {
    logger.error("EDGE_CALLBACK_SECRET not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const inputs = (body.inputs ?? []).filter(
    (
      x,
    ): x is { playerLocalId: string; newTeamLocalId: string | null } =>
      typeof x?.playerLocalId === "string",
  );

  if (inputs.length === 0) {
    return NextResponse.json({ ok: true, opened: 0, closed: 0, errors: 0 });
  }

  try {
    const result = await reconcilePlayerTeamHistory(inputs);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    logger.error("reconcile-history callback failed", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
