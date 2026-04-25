import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

/** GET — Get Stripe Connect status for the current coach */
export async function GET() {
  try {
    const supabase: S = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: coach } = await supabase
      .from("coach_profiles")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("player_id", user.id)
      .single();

    if (!coach) return NextResponse.json({ error: "Coach profile not found" }, { status: 404 });

    let dashboardUrl: string | null = null;
    if (coach.stripe_account_id && coach.stripe_onboarding_complete) {
      try {
        const loginLink = await getStripe().accounts.createLoginLink(coach.stripe_account_id);
        dashboardUrl = loginLink.url;
      } catch (err) {
        logger.error("Failed to create Stripe login link", { error: err });
      }
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

/** POST — Create or resume Stripe Connect onboarding for the current coach */
export async function POST() {
  try {
    const supabase: S = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: coach } = await supabase
      .from("coach_profiles")
      .select("id, stripe_account_id, stripe_onboarding_complete")
      .eq("player_id", user.id)
      .single();

    if (!coach) return NextResponse.json({ error: "Coach profile not found" }, { status: 404 });

    let accountId = coach.stripe_account_id;

    // Create Stripe Express account if none exists
    if (!accountId) {
      const account = await getStripe().accounts.create({
        type: "express",
        metadata: { coach_profile_id: coach.id, player_id: user.id },
      });
      accountId = account.id;
      await supabase
        .from("coach_profiles")
        .update({ stripe_account_id: accountId })
        .eq("id", coach.id);
    }

    // Create onboarding link
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const accountLink = await getStripe().accountLinks.create({
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
