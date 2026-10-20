import { NextRequest, NextResponse } from "next/server";
import { adminGuardResponse } from "@/lib/auth-admin";
import { logger } from "@/lib/logger";
import { cancelDeletion, getDeletionStatus } from "@/lib/services/accountDeletionServerService";
import { purgeAccount } from "@/lib/services/accountPurgeService";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function guardedId(
  context: RouteContext
): Promise<{ denied: NextResponse } | { id: string }> {
  const denied = await adminGuardResponse();
  if (denied) return { denied };
  const { id } = await context.params;
  if (!UUID_REGEX.test(id)) {
    return { denied: NextResponse.json({ error: "Invalid id" }, { status: 400 }) };
  }
  return { id };
}

/** POST /api/admin/account-deletions/[id] — Admin: purge a pending deletion now. */
export async function POST(_request: NextRequest, context: RouteContext) {
  const guard = await guardedId(context);
  if ("denied" in guard) return guard.denied;
  const { id } = guard;

  try {
    const status = await getDeletionStatus(id);
    if (!status.pending)
      return NextResponse.json({ error: "No pending deletion" }, { status: 404 });

    const outcome = await purgeAccount(id);
    if (!outcome.ok) return NextResponse.json({ error: "Purge failed" }, { status: 500 });
    return NextResponse.json(outcome);
  } catch (error) {
    logger.error("Admin account purge failed", { error, userId: id });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** DELETE /api/admin/account-deletions/[id] — Admin: cancel a pending deletion. */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const guard = await guardedId(context);
  if ("denied" in guard) return guard.denied;
  const { id } = guard;

  try {
    const cancelled = await cancelDeletion(id);
    if (!cancelled) return NextResponse.json({ error: "No pending deletion" }, { status: 404 });
    return NextResponse.json({ cancelled: true });
  } catch (error) {
    logger.error("Admin account deletion cancel failed", { error, userId: id });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
