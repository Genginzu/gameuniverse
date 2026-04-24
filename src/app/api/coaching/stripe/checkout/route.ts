import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getStripe, PLATFORM_FEE_RATE } from "@/lib/stripe";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

/** POST — Create a Stripe Checkout Session for a coaching session */
export async function POST(request: NextRequest) {
  try {
    const supabase: S = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sessionId } = await request.json();
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    // Fetch coaching session
    const { data: session } = await supabase
      .from("coaching_sessions").select("*").eq("id", sessionId).single();

    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (session.student_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (session.payment_status !== "pending") return NextResponse.json({ error: "Already paid" }, { status: 409 });

    // Get coach's Stripe account
    const { data: coach } = await supabase
      .from("coach_profiles").select("stripe_account_id, stripe_onboarding_complete")
      .eq("id", session.coach_id).single();

    if (!coach?.stripe_account_id || !coach.stripe_onboarding_complete) {
      return NextResponse.json({ error: "Coach has not completed Stripe setup" }, { status: 400 });
    }

    // Get pricing info
    const { data: pricing } = session.pricing_id
      ? await supabase.from("coach_pricing").select("price_amount, price_currency, session_type").eq("id", session.pricing_id).single()
      : { data: null };

    const amount = pricing?.price_amount ?? session.payment_amount ?? 0;
    const amountCents = Math.round(amount * 100);
    const feeCents = Math.round(amountCents * PLATFORM_FEE_RATE);

    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: pricing?.price_currency?.toLowerCase() || "eur",
          product_data: { name: `Coaching session — ${pricing?.session_type || "session"}` },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      payment_intent_data: {
        application_fee_amount: feeCents,
        transfer_data: { destination: coach.stripe_account_id },
        metadata: { coaching_session_id: sessionId },
      },
      metadata: { coaching_session_id: sessionId },
      success_url: `${origin}/coaching/sessions?payment=success`,
      cancel_url: `${origin}/coaching/sessions?payment=cancelled`,
    });

    // Store payment amount on session
    await supabase.from("coaching_sessions").update({
      payment_amount: amount,
      platform_fee: amount * PLATFORM_FEE_RATE,
      coach_payout: amount * (1 - PLATFORM_FEE_RATE),
    }).eq("id", sessionId);

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    logger.error("Error creating checkout session", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
