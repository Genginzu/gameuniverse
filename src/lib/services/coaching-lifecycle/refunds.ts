import { logger } from "@/lib/logger";
import type {
  CoachingLifecycleDeps,
  LifecycleSession,
  RefundOutcome,
} from "@/types/coaching-lifecycle";

/** Same key for every attempt on a session: the provider never refunds a session twice. */
export const refundIdempotencyKey = (sessionId: string) => `coaching-refund-${sessionId}`;

/**
 * Settle a session already claimed into `refund_pending`.
 *
 * The provider call is idempotent on the session; the final claim only succeeds
 * from `refund_pending`, so a concurrent charge.refunded settling first is fine.
 * A provider failure leaves the session `refund_pending` for a later settlement.
 */
export async function settleRefund(
  { store, payments }: CoachingLifecycleDeps,
  session: LifecycleSession
): Promise<{ outcome: RefundOutcome; session: LifecycleSession }> {
  const amount = Number(session.refundAmount ?? 0);
  try {
    await payments.refund({
      sessionId: session.id,
      amountCents: Math.round(amount * 100),
      idempotencyKey: refundIdempotencyKey(session.id),
    });
  } catch (error) {
    logger.error("Coaching refund failed, left pending", { error, sessionId: session.id });
    return { outcome: "pending", session };
  }

  await store.claim(
    session.id,
    { status: session.status, paymentStatus: "refund_pending" },
    { paymentStatus: "refunded" }
  );
  const settled = (await store.load(session.id)) ?? session;
  return { outcome: settled.paymentStatus === "refunded" ? "refunded" : "pending", session: settled };
}
