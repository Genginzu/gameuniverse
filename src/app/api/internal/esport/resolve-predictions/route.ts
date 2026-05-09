/**
 * POST /api/internal/esport/resolve-predictions
 *
 * Internal callback invoked by the PandaScore Edge Functions when a
 * match transitions to `finished` with a known winner. Settles the
 * matching `esport_predictions` rows (payouts, GU coins credit,
 * notifications), all of which require server-side logic that wasn't
 * ported to Deno.
 *
 * Authentication: same shared secret as `/api/internal/esport/reconcile-history`.
 */

import { NextRequest, NextResponse } from "next/server";
import { resolvePredictionsForMatch } from "@/lib/services/esportPredictionService";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface RequestBody {
  matchPandaId?: number;
  winnerPandaId?: number;
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

  if (
    typeof body.matchPandaId !== "number" ||
    typeof body.winnerPandaId !== "number"
  ) {
    return NextResponse.json(
      { error: "Invalid body: matchPandaId and winnerPandaId required" },
      { status: 400 },
    );
  }

  try {
    const resolved = await resolvePredictionsForMatch(
      body.matchPandaId,
      body.winnerPandaId,
    );
    return NextResponse.json({ ok: true, resolved });
  } catch (error) {
    logger.error("resolve-predictions callback failed", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
