import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import { claimEvent, handleStripeEvent, releaseEvent } from "@/lib/services/stripeWebhookService";

/**
 * POST /api/webhooks/stripe
 *
 * Verifies the Stripe signature, then processes each event id once
 * (stripe_webhook_events ledger). A processing failure releases the claim and
 * returns 500 so Stripe retries instead of silently losing the update.
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  try {
    if ((await claimEvent(db, event)) === "duplicate") {
      return NextResponse.json({ received: true, duplicate: true });
    }
  } catch (error) {
    logger.error("Could not record Stripe event", { error, eventId: event.id });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  try {
    await handleStripeEvent(event, db);
  } catch (error) {
    logger.error("Error processing Stripe webhook", { error, eventType: event.type, eventId: event.id });
    await releaseEvent(db, event.id).catch(() => undefined);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
