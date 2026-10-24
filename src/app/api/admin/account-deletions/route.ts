import { NextResponse } from "next/server";
import { defineRoute } from "@/lib/api/route";
import { listPendingDeletions } from "@/lib/services/accountDeletionServerService";
import type { PendingAccountDeletionsResponse } from "@/types/account-deletion";

/** GET /api/admin/account-deletions — Admin: accounts in their deletion grace period. */
export const GET = defineRoute({ auth: "admin" }, async () => {
  const body: PendingAccountDeletionsResponse = { deletions: await listPendingDeletions() };
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
});
