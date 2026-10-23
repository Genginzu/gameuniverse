import type Stripe from "stripe";
import type { PaymentGateway, PaymentReport } from "@/types/coaching-lifecycle";

/** PaymentGateway over Stripe. Payment intents carry `metadata.coaching_session_id`. */
export function createStripePaymentGateway(stripe: Stripe): PaymentGateway {
  return {
    async refund({ sessionId, amountCents, idempotencyKey }) {
      const payments = await stripe.paymentIntents.search({
        query: `metadata["coaching_session_id"]:"${sessionId}"`,
      });
      const paymentIntent = payments.data[0];
      if (!paymentIntent) throw new Error(`No payment intent found for session ${sessionId}`);
      await stripe.refunds.create(
        { payment_intent: paymentIntent.id, amount: amountCents },
        { idempotencyKey }
      );
    },

    async sessionIdForPaymentIntent(paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent.metadata?.coaching_session_id ?? null;
    },
  };
}

/** Map a Stripe checkout session to a lifecycle payment report; null when not a coaching checkout. */
export function paymentReportFromCheckout(
  checkout: Stripe.Checkout.Session
): Omit<PaymentReport, "expectedStudentId"> | null {
  const sessionId = checkout.metadata?.coaching_session_id;
  if (!sessionId) return null;
  return {
    sessionId,
    paid: checkout.payment_status === "paid",
    amountTotalCents: checkout.amount_total ?? null,
  };
}
