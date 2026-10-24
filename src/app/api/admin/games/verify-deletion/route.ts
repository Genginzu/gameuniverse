import { NextResponse } from "next/server";
import { defineRoute } from "@/lib/api/route";
import { verifyGameDeletionConsistency } from "@/lib/realtime-updates";
import { z } from "zod";

const verifyDeletionSchema = z.object({
  game_ids: z.array(z.string().uuid()).min(1).max(100),
});

/**
 * POST /api/admin/games/verify-deletion - Verify that deleted games are completely removed
 */
export const POST = defineRoute({ auth: "admin", body: verifyDeletionSchema }, async ({ body }) => {
  const { game_ids } = body;

  // Verify deletion consistency
  const verificationResult = await verifyGameDeletionConsistency(game_ids);

  return NextResponse.json({
    message: "Deletion consistency verification completed",
    gameIds: game_ids,
    result: verificationResult,
    timestamp: new Date().toISOString(),
  });
});
