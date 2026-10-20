import { NextResponse } from "next/server";
import { adminGuardResponse } from "@/lib/auth-admin";
import { logger } from "@/lib/logger";
import { listPendingDeletions } from "@/lib/services/accountDeletionServerService";
import type { PendingAccountDeletionsResponse } from "@/types/account-deletion";

/** GET /api/admin/account-deletions — Admin: accounts in their deletion grace period. */
export async function GET() {
  const denied = await adminGuardResponse();
  if (denied) return denied;

  try {
    const body: PendingAccountDeletionsResponse = { deletions: await listPendingDeletions() };
    return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logger.error("Failed to list pending account deletions", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
