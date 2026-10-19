import type Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getStripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";

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

async function markSessionPaid(db: Db, checkout: Stripe.Checkout.Session): Promise<void> {
  const sessionId = checkout.metadata?.coaching_session_id;
  if (!sessionId) return;

  // async payment methods emit checkout.session.completed while still unpaid.
  if (checkout.payment_status !== "paid") return;

  const { data: session, error } = await db
    .from("coaching_sessions")
    .select("payment_amount, payment_status")
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load coaching session: ${error.message}`);
  if (!session || session.payment_status !== "pending") return;

  const expectedCents = Math.round(Number(session.payment_amount ?? 0) * 100);
  if (!expectedCents || checkout.amount_total !== expectedCents) {
    logger.error("Stripe checkout amount does not match the session price", {
      sessionId,
      amountTotal: checkout.amount_total,
      expectedCents,
    });
    return;
  }

  const { error: updateError } = await db
    .from("coaching_sessions")
    .update({ payment_status: "paid" })
    .eq("id", sessionId)
    .eq("payment_status", "pending");
  if (updateError) throw new Error(`Failed to mark session paid: ${updateError.message}`);
  logger.info("Payment completed for session", { sessionId });
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

async function markSessionRefunded(db: Db, charge: Stripe.Charge): Promise<void> {
  const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!pi) return;

  const paymentIntent = await getStripe().paymentIntents.retrieve(pi);
  const sessionId = paymentIntent.metadata?.coaching_session_id;
  if (!sessionId) return;

  const { error } = await db
    .from("coaching_sessions")
    .update({ payment_status: "refunded" })
    .eq("id", sessionId);
  if (error) throw new Error(`Failed to mark session refunded: ${error.message}`);
  logger.info("Refund processed for session", { sessionId });
}

/** Apply a verified Stripe event. Throws on DB failure so the caller returns 500. */
export async function handleStripeEvent(event: Stripe.Event, db: Db = getSupabaseAdmin()): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await markSessionPaid(db, event.data.object as Stripe.Checkout.Session);
      return;
    case "account.updated":
      await markOnboardingComplete(db, event.data.object as Stripe.Account);
      return;
    case "charge.refunded":
      await markSessionRefunded(db, event.data.object as Stripe.Charge);
      return;
    default:
      return;
  }
}
