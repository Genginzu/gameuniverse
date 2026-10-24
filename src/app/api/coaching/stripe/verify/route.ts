import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import { getCoachingLifecycle, paymentReportFromCheckout } from "@/lib/services/coaching-lifecycle";
import type { RecordPaymentResult } from "@/types/coaching-lifecycle";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

const FAILURE_STATUS: Record<Extract<RecordPaymentResult, { ok: false }>["reason"], number> = {
  not_paid: 400,
  not_found: 404,
  forbidden: 403,
  amount_mismatch: 409,
  not_payable: 409,
};

/** POST /api/coaching/stripe/verify — Confirm a Stripe checkout on the student's return. */
export async function POST(request: NextRequest) {
  try {
    const supabase: S = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { checkoutSessionId } = await request.json();
    if (!checkoutSessionId)
      return NextResponse.json({ error: "checkoutSessionId required" }, { status: 400 });

    const checkout = await getStripe().checkout.sessions.retrieve(checkoutSessionId);
    const report = paymentReportFromCheckout(checkout);
    if (!report) return NextResponse.json({ error: "No session linked" }, { status: 400 });

    const result = await getCoachingLifecycle().recordPayment({
      ...report,
      expectedStudentId: user.id,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.reason, status: checkout.payment_status },
        { status: FAILURE_STATUS[result.reason] }
      );
    }
    return NextResponse.json({ success: true, alreadyPaid: result.outcome === "already_recorded" });
  } catch (error) {
    logger.error("Error verifying payment", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
