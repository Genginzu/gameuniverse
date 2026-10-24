import type Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import {
  getCoachingLifecycle,
  paymentReportFromCheckout,
  type CoachingLifecycle,
} from "@/lib/services/coaching-lifecycle";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

/** Claim result for a Stripe event id (idempotency ledger). */
export type EventClaim = "claimed" | "duplicate";

/** Record the event id once; a second delivery of the same id is a duplicate. */
export async function claimEvent(db: Db, event: Stripe.Event): Promise<EventClaim> {
  const { error } = await db
    .from("stripe_webhook_events")
    .insert({ id: event.id, type: event.type });
  if (!error) return "claimed";
  if (error.code === "23505") return "duplicate";
  throw new Error(`Failed to record Stripe event: ${error.message}`);
}

/** Release a claim so the Stripe retry of a failed event is processed. */
export async function releaseEvent(db: Db, eventId: string): Promise<void> {
  await db.from("stripe_webhook_events").delete().eq("id", eventId);
}

async function markOnboardingComplete(db: Db, account: Stripe.Account): Promise<void> {
  if (!account.charges_enabled || !account.details_submitted) return;
  const { error } = await db
    .from("coach_profiles")
    .update({ stripe_onboarding_complete: true })
    .eq("stripe_account_id", account.id);
  if (error) throw new Error(`Failed to mark onboarding complete: ${error.message}`);
  logger.info("Stripe onboarding complete", { accountId: account.id });
}

async function recordCheckout(
  lifecycle: CoachingLifecycle,
  checkout: Stripe.Checkout.Session
): Promise<void> {
  const report = paymentReportFromCheckout(checkout);
  // Async payment methods emit checkout.session.completed while still unpaid.
  if (!report?.paid) return;
  await lifecycle.recordPayment(report);
}

async function recordChargeRefund(lifecycle: CoachingLifecycle, charge: Stripe.Charge): Promise<void> {
  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) return;
  await lifecycle.recordExternalRefund({
    paymentIntentId,
    amountRefundedCents: charge.amount_refunded,
  });
}

/** Apply a verified Stripe event. Throws on DB failure so the caller returns 500. */
export async function handleStripeEvent(
  event: Stripe.Event,
  db: Db = getSupabaseAdmin(),
  lifecycle: CoachingLifecycle = getCoachingLifecycle()
): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await recordCheckout(lifecycle, event.data.object as Stripe.Checkout.Session);
      return;
    case "account.updated":
      await markOnboardingComplete(db, event.data.object as Stripe.Account);
      return;
    case "charge.refunded":
      await recordChargeRefund(lifecycle, event.data.object as Stripe.Charge);
      return;
    default:
      return;
  }
}
