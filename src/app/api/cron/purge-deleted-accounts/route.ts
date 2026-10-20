import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { listDueDeletions } from "@/lib/services/accountDeletionServerService";
import { purgeAccount } from "@/lib/services/accountPurgeService";
import { bearerToken, safeEqual } from "@/lib/utils/safeEqual";
import type { AccountPurgeOutcome } from "@/types/account-deletion";

const MAX_ACCOUNTS_PER_RUN = 25;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (
    safeEqual(bearerToken(request.headers.get("authorization")), secret) ||
    safeEqual(request.headers.get("x-cron-secret"), secret)
  );
}

export const GET = handler;
export const POST = handler;

/** Daily job: permanently deletes accounts whose 30-day grace period is over. */
async function handler(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userIds: string[];
  try {
    userIds = await listDueDeletions(MAX_ACCOUNTS_PER_RUN);
  } catch (error) {
    logger.error("cron purge-deleted-accounts select failed", { error });
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  const outcomes: AccountPurgeOutcome[] = [];
  for (const userId of userIds) {
    try {
      outcomes.push(await purgeAccount(userId));
    } catch (error) {
      const message = error instanceof Error ? error.message : "purge failed";
      logger.error("cron purge-deleted-accounts user failed", { userId, message });
      outcomes.push({ userId, ok: false, error: message });
    }
  }

  return NextResponse.json({
    processed: outcomes.length,
    purged: outcomes.filter((outcome) => outcome.ok).length,
    failed: outcomes.filter((outcome) => !outcome.ok).length,
    outcomes: outcomes.map(({ userId, ok, error }) => ({ userId, ok, error })),
  });
}
