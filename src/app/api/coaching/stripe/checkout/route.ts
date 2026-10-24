import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getStripe, PLATFORM_FEE_RATE } from "@/lib/stripe";
import { isPayableSession } from "@/lib/services/coaching-lifecycle";
import { conflict, defineRoute, forbidden, notFound, validationError } from "@/lib/api/route";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

const checkoutBodySchema = z.looseObject({ sessionId: z.any().optional() });

/** POST — Create a Stripe Checkout Session for a coaching session */
export const POST = defineRoute(
  { auth: "required", rateLimit: "coachingBooking", body: checkoutBodySchema },
  async ({ user, body }) => {
    const supabase: S = await createRouteHandlerClient();

    const { sessionId } = body;
    if (!sessionId) throw validationError(undefined, "sessionId required");

    // Fetch coaching session
    const { data: session } = await supabase
      .from("coaching_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (!session) throw notFound("Session not found");
    if (session.student_id !== user.id) throw forbidden("Forbidden");
    if (!isPayableSession({ status: session.status, paymentStatus: session.payment_status }))
      throw conflict("Session is not awaiting payment");

    // Get coach's Stripe account
    const { data: coach } = await supabase
      .from("coach_profiles")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("id", session.coach_id)
      .single();

    if (!coach?.stripe_account_id || !coach.stripe_onboarding_complete) {
      return NextResponse.json({ error: "Coach has not completed Stripe setup" }, { status: 400 });
    }

    const pricing = await fetchCoachTier(supabase, session.pricing_id, session.coach_id);
    const amount: number | null = session.payment_amount ?? pricing?.price_amount ?? null;
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Session has no valid price" }, { status: 400 });
    }

    const amountCents = Math.round(amount * 100);
    const feeCents = Math.round(amountCents * PLATFORM_FEE_RATE);

    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const stripe = getStripe();

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: pricing?.price_currency?.toLowerCase() || "eur",
            product_data: { name: `Coaching session — ${pricing?.session_type || "session"}` },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: feeCents,
        transfer_data: { destination: coach.stripe_account_id },
        metadata: { coaching_session_id: sessionId },
      },
      metadata: { coaching_session_id: sessionId },
      success_url: `${origin}/coaching/sessions?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/coaching/sessions?payment=cancelled`,
    });

    // Payment columns are server-only (trigger on coaching_sessions): write them
    // with the service role once ownership and state have been checked above.
    await getSupabaseAdmin()
      .from("coaching_sessions")
      .update({
        payment_amount: amount,
        platform_fee: amount * PLATFORM_FEE_RATE,
        coach_payout: amount * (1 - PLATFORM_FEE_RATE),
      })
      .eq("id", sessionId)
      .eq("payment_status", "pending");

    return NextResponse.json({ url: checkoutSession.url });
  }
);

/**
 * Load the pricing tier of a session, only if it belongs to the session's coach.
 * Guards legacy rows booked before the coaching_sessions trigger existed.
 */
async function fetchCoachTier(
  supabase: S,
  pricingId: string | null,
  coachId: string
): Promise<{ price_amount: number; price_currency: string | null; session_type: string } | null> {
  if (!pricingId) return null;
  const { data } = await supabase
    .from("coach_pricing")
    .select("price_amount, price_currency, session_type, coach_games!inner(coach_id)")
    .eq("id", pricingId)
    .eq("coach_games.coach_id", coachId)
    .maybeSingle();
  return data ?? null;
}
