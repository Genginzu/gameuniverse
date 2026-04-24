import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

/** POST — Create or resume Stripe Connect onboarding for the current coach */
export async function POST() {
  try {
    const stripe = getStripe();

    const supabase: S = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: coach } = await supabase
      .from("coach_profiles").select("id, stripe_account_id, stripe_onboarding_complete")
      .eq("player_id", user.id).single();

    if (!coach) return NextResponse.json({ error: "Coach profile not found" }, { status: 404 });

    let accountId = coach.stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        metadata: { coach_profile_id: coach.id, player_id: user.id },
      });
      accountId = account.id;
      await supabase.from("coach_profiles").update({ stripe_account_id: accountId }).eq("id", coach.id);
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/coaching/settings?stripe=refresh`,
      return_url: `${origin}/coaching/settings?stripe=complete`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    logger.error("Error in Stripe Connect onboarding", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** GET — Get Stripe Connect status for the current coach */
export async function GET() {
  try {
    const supabase: S = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: coach } = await supabase
      .from("coach_profiles").select("stripe_account_id, stripe_onboarding_complete")
      .eq("player_id", user.id).single();

    if (!coach) return NextResponse.json({ error: "Coach profile not found" }, { status: 404 });

    let dashboardUrl: string | null = null;
    const stripe = getStripe();

    // Sync onboarding status from Stripe if account exists but not yet marked complete
    if (coach.stripe_account_id && !coach.stripe_onboarding_complete) {
      const account = await stripe.accounts.retrieve(coach.stripe_account_id);
      if (account.charges_enabled) {
        await supabase.from("coach_profiles")
          .update({ stripe_onboarding_complete: true })
          .eq("player_id", user.id);
        coach.stripe_onboarding_complete = true;
      }
    }

    if (coach.stripe_account_id && coach.stripe_onboarding_complete) {
      const loginLink = await stripe.accounts.createLoginLink(coach.stripe_account_id);
      dashboardUrl = loginLink.url;
    }

    return NextResponse.json({
      hasAccount: !!coach.stripe_account_id,
      onboardingComplete: coach.stripe_onboarding_complete,
      dashboardUrl,
    });
  } catch (error) {
    logger.error("Error fetching Stripe status", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
