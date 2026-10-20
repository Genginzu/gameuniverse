import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { enforceRateLimit } from "@/lib/services/rateLimitService";
import { reauthenticate } from "@/lib/services/reauthService";
import { sendDeletionRequestedEmail } from "@/lib/services/accountDeletionEmails";
import {
  cancelDeletion,
  findDeletionBlocker,
  getDeletionStatus,
  requestDeletion,
} from "@/lib/services/accountDeletionServerService";
import { isValidConfirmation } from "@/lib/utils/accountDeletion";
import type {
  AccountDeletionErrorCode,
  AccountDeletionRequestPayload,
} from "@/types/account-deletion";

const NO_STORE = { "Cache-Control": "no-store" };

async function currentUser() {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function refused(code: AccountDeletionErrorCode, status: number) {
  return NextResponse.json({ error: "Deletion refused", code }, { status });
}

/** GET /api/account/deletion — Signed-in user: pending deletion status. */
export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();

  try {
    return NextResponse.json(await getDeletionStatus(user.id), { headers: NO_STORE });
  } catch (error) {
    logger.error("Failed to read account deletion status", { error, userId: user.id });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/account/deletion — Request deletion: re-authentication + typed
 * confirmation word, then the account is deactivated for the grace period.
 */
export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const limited = await enforceRateLimit("accountDeletion", { userId: user.id });
  if (limited) return limited;

  const body = (await request.json().catch(() => ({}))) as Partial<AccountDeletionRequestPayload>;
  const locale = body.locale === "en" ? "en" : "fr";

  if (!isValidConfirmation(body.confirmation, locale)) return refused("invalidConfirmation", 400);

  const reauth = await reauthenticate(user, body.password);
  if (reauth !== "ok") return refused(reauth, 403);

  try {
    const blocker = await findDeletionBlocker(user.id);
    if (blocker) return refused(blocker, 409);

    const status = await requestDeletion(user.id);
    if (!status) return refused("alreadyPending", 409);

    if (user.email && status.scheduledFor) {
      await sendDeletionRequestedEmail(user.email, locale, new Date(status.scheduledFor));
    }

    logger.info("Account deletion requested", {
      userId: user.id,
      scheduledFor: status.scheduledFor,
    });
    return NextResponse.json(status, { headers: NO_STORE });
  } catch (error) {
    logger.error("Failed to request account deletion", { error, userId: user.id });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** DELETE /api/account/deletion — Cancel a pending deletion (grace period). */
export async function DELETE() {
  const user = await currentUser();
  if (!user) return unauthorized();

  try {
    const cancelled = await cancelDeletion(user.id);
    if (!cancelled) return NextResponse.json({ error: "No pending deletion" }, { status: 404 });

    logger.info("Account deletion cancelled", { userId: user.id });
    return NextResponse.json(await getDeletionStatus(user.id), { headers: NO_STORE });
  } catch (error) {
    logger.error("Failed to cancel account deletion", { error, userId: user.id });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
