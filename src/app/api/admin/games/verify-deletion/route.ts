import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { verifyGameDeletionConsistency } from "@/lib/realtime-updates";
import { z } from "zod";
import { logger } from "@/lib/logger";

const verifyDeletionSchema = z.object({
  game_ids: z.array(z.string().uuid()).min(1).max(100),
});

/**
 * POST /api/admin/games/verify-deletion - Verify that deleted games are completely removed
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    await requireAdmin();

    const body = await request.json();

    // Validate input data
    const validationResult = verifyDeletionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { game_ids } = validationResult.data;

    // Verify deletion consistency
    const verificationResult = await verifyGameDeletionConsistency(game_ids);

    return NextResponse.json({
      message: "Deletion consistency verification completed",
      gameIds: game_ids,
      result: verificationResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error in deletion verification", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
