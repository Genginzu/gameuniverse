import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getStripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import { calculateRefund } from "@/lib/services/cancellationService";
import type { CancellationPolicy } from "@/types/coaching";

interface CancelledSession {
  id: string;
  scheduled_at: string;
  payment_amount: number | null;
  payment_status: string;
}

/**
 * Refund a paid coaching session that has just been cancelled.
 *
 * Must be called only after the caller has atomically moved the session to
 * `cancelled`, so a given session can reach this code once. The Stripe
 * idempotency key is a second guard against double refunds. Payment columns are
 * server-only, hence the service-role client.
 */
export async function refundCancelledSession(
  session: CancelledSession,
  policy: CancellationPolicy | null
): Promise<void> {
  if (!policy || session.payment_status !== "paid" || !session.payment_amount) return;

  const paymentAmount = Number(session.payment_amount);
  const { refundAmount: computed } = calculateRefund(policy, session.scheduled_at, paymentAmount);
  const refundAmount = Math.min(Math.max(computed, 0), paymentAmount);
  if (refundAmount <= 0) return;

  const stripe = getStripe();
  const payments = await stripe.paymentIntents.search({
    query: `metadata["coaching_session_id"]:"${session.id}"`,
  });
  const paymentIntent = payments.data[0];
  if (!paymentIntent) {
    logger.error("No payment intent found for paid session", { sessionId: session.id });
    return;
  }

  await stripe.refunds.create(
    { payment_intent: paymentIntent.id, amount: Math.round(refundAmount * 100) },
    { idempotencyKey: `coaching-refund-${session.id}` }
  );

  const { error } = await getSupabaseAdmin()
    .from("coaching_sessions")
    .update({ refund_amount: refundAmount, payment_status: "refunded" })
    .eq("id", session.id);

  if (error) {
    logger.error("Refund issued but session update failed", { error, sessionId: session.id });
  }
}
