import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import type Stripe from "stripe";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase: S = getSupabaseAdmin();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const sessionId = session.metadata?.coaching_session_id;
        if (sessionId) {
          await supabase.from("coaching_sessions")
            .update({ payment_status: "paid" })
            .eq("id", sessionId);
          logger.info("Payment completed for session", { sessionId });
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        if (account.charges_enabled && account.details_submitted) {
          await supabase.from("coach_profiles")
            .update({ stripe_onboarding_complete: true })
            .eq("stripe_account_id", account.id);
          logger.info("Stripe onboarding complete", { accountId: account.id });
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        if (pi) {
          const paymentIntent = await stripe.paymentIntents.retrieve(pi);
          const sessionId = paymentIntent.metadata?.coaching_session_id;
          if (sessionId) {
            await supabase.from("coaching_sessions")
              .update({ payment_status: "refunded" })
              .eq("id", sessionId);
            logger.info("Refund processed for session", { sessionId });
          }
        }
        break;
      }
    }
  } catch (error) {
    logger.error("Error processing Stripe webhook", { error, eventType: event.type });
  }

  return NextResponse.json({ received: true });
}
