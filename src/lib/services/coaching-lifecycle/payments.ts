import { logger } from "@/lib/logger";
import {
  expectedCents,
  isPayableSession,
  stateOf,
  withPatch,
} from "@/lib/services/coaching-lifecycle/rules";
import { settleRefund } from "@/lib/services/coaching-lifecycle/refunds";
import type {
  CoachingLifecycleDeps,
  ExternalRefundReport,
  PaymentReport,
  PaymentStatus,
  RecordExternalRefundResult,
  RecordPaymentResult,
  SessionPatch,
} from "@/types/coaching-lifecycle";

/** A lost claim means another writer moved the session: re-read and decide again. */
const MAX_CLAIM_ATTEMPTS = 3;
const REFUNDABLE: PaymentStatus[] = ["paid", "refund_pending"];

function contention(sessionId: string): never {
  throw new Error(`Coaching session ${sessionId} kept changing during the payment update`);
}

/**
 * Record a verified provider payment. Whoever wins the pending -> paid claim
 * notifies, so concurrent confirmations (verify + webhook) notify once.
 * A payment landing on a cancelled session is refunded in full.
 */
export async function recordPayment(
  deps: CoachingLifecycleDeps,
  report: PaymentReport
): Promise<RecordPaymentResult> {
  if (!report.paid) return { ok: false, reason: "not_paid" };

  for (let attempt = 0; attempt < MAX_CLAIM_ATTEMPTS; attempt++) {
    const session = await deps.store.load(report.sessionId);
    if (!session) return { ok: false, reason: "not_found" };
    if (report.expectedStudentId && session.studentId !== report.expectedStudentId) {
      return { ok: false, reason: "forbidden" };
    }
    if (session.paymentStatus !== "pending") return { ok: true, outcome: "already_recorded" };

    const cents = expectedCents(session);
    if (!cents || report.amountTotalCents !== cents) {
      logger.error("Coaching payment amount does not match the session price", {
        sessionId: session.id,
        amountTotal: report.amountTotalCents,
        expectedCents: cents,
      });
      return { ok: false, reason: "amount_mismatch" };
    }

    if (isPayableSession(session)) {
      if (!(await deps.store.claim(session.id, stateOf(session), { paymentStatus: "paid" }))) continue;
      await deps.effects.notifyPaid({ sessionId: session.id, studentId: session.studentId });
      return { ok: true, outcome: "paid" };
    }

    if (session.status === "cancelled") {
      const patch: SessionPatch = {
        paymentStatus: "refund_pending",
        refundAmount: Number(session.paymentAmount),
      };
      if (!(await deps.store.claim(session.id, stateOf(session), patch))) continue;
      await settleRefund(deps, withPatch(session, patch));
      return { ok: true, outcome: "refund_started" };
    }

    logger.error("Payment received for a session that is not payable", {
      sessionId: session.id,
      status: session.status,
    });
    return { ok: false, reason: "not_payable" };
  }
  return contention(report.sessionId);
}

/** Record a refund reported by the provider (dashboard refund or our own refund settling). */
export async function recordExternalRefund(
  deps: CoachingLifecycleDeps,
  report: ExternalRefundReport
): Promise<RecordExternalRefundResult> {
  const sessionId = await deps.payments.sessionIdForPaymentIntent(report.paymentIntentId);
  if (!sessionId) return "ignored";

  for (let attempt = 0; attempt < MAX_CLAIM_ATTEMPTS; attempt++) {
    const session = await deps.store.load(sessionId);
    if (!session || !REFUNDABLE.includes(session.paymentStatus)) return "ignored";

    const patch: SessionPatch = {
      paymentStatus: "refunded",
      refundAmount: report.amountRefundedCents / 100,
    };
    if (await deps.store.claim(session.id, stateOf(session), patch)) {
      logger.info("Refund recorded for coaching session", { sessionId });
      return "refunded";
    }
  }
  return contention(sessionId);
}
