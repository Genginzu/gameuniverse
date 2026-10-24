import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";
import { defineRoute } from "@/lib/api/route";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

/** POST /api/coaching/payments/payout — Request payout to coach's bank account */
export const POST = defineRoute(
  { auth: "required", rateLimit: "coachingPayout" },
  async ({ user }) => {
    const supabase: S = await createRouteHandlerClient();

    const { data: coach } = await supabase
      .from("coach_profiles")
      .select("id, stripe_account_id, stripe_onboarding_complete")
      .eq("player_id", user.id)
      .single();

    if (!coach?.stripe_account_id || !coach.stripe_onboarding_complete) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
    }

    const stripe = getStripe();

    // Check available balance on the connected account
    const balance = await stripe.balance.retrieve(undefined, { stripeAccount: coach.stripe_account_id });
    const available = balance.available.reduce((sum, b) => sum + b.amount, 0);

    if (available <= 0) {
      return NextResponse.json({ error: "No funds available", available: 0 }, { status: 400 });
    }

    // Create payout to the coach's default bank account
    const payout = await stripe.payouts.create(
      { amount: available, currency: balance.available[0].currency },
      { stripeAccount: coach.stripe_account_id }
    );

    return NextResponse.json({
      success: true,
      amount: payout.amount / 100,
      currency: payout.currency,
      arrivalDate: payout.arrival_date,
    });
  }
);
