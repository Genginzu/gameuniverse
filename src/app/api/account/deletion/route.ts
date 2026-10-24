import { NextResponse } from "next/server";
import { z } from "zod";
import { defineRoute, notFound } from "@/lib/api/route";
import { logger } from "@/lib/logger";
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

const deletionRequestSchema = z.looseObject({
  password: z.unknown().optional(),
  confirmation: z.unknown().optional(),
  locale: z.unknown().optional(),
});

function refused(code: AccountDeletionErrorCode, status: number) {
  return NextResponse.json({ error: "Deletion refused", code }, { status });
}

/** GET /api/account/deletion — Signed-in user: pending deletion status. */
export const GET = defineRoute({ auth: "required" }, async ({ user }) => {
  return NextResponse.json(await getDeletionStatus(user.id), { headers: NO_STORE });
});

/**
 * POST /api/account/deletion — Request deletion: re-authentication + typed
 * confirmation word, then the account is deactivated for the grace period.
 */
export const POST = defineRoute(
  { auth: "required", rateLimit: "accountDeletion", body: deletionRequestSchema },
  async ({ user, body: rawBody }) => {
    const body = rawBody as Partial<AccountDeletionRequestPayload>;
    const locale = body.locale === "en" ? "en" : "fr";

    if (!isValidConfirmation(body.confirmation, locale)) return refused("invalidConfirmation", 400);

    const reauth = await reauthenticate(user, body.password);
    if (reauth !== "ok") return refused(reauth, 403);

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
  }
);

/** DELETE /api/account/deletion — Cancel a pending deletion (grace period). */
export const DELETE = defineRoute({ auth: "required" }, async ({ user }) => {
  const cancelled = await cancelDeletion(user.id);
  if (!cancelled) throw notFound("No pending deletion");

  logger.info("Account deletion cancelled", { userId: user.id });
  return NextResponse.json(await getDeletionStatus(user.id), { headers: NO_STORE });
});
