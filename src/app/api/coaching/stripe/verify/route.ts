import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { defineRoute, validationError } from "@/lib/api/route";
import { getCoachingLifecycle, paymentReportFromCheckout } from "@/lib/services/coaching-lifecycle";
import type { RecordPaymentResult } from "@/types/coaching-lifecycle";

const FAILURE_STATUS: Record<Extract<RecordPaymentResult, { ok: false }>["reason"], number> = {
  not_paid: 400,
  not_found: 404,
  forbidden: 403,
  amount_mismatch: 409,
  not_payable: 409,
};

const verifyBodySchema = z.looseObject({ checkoutSessionId: z.any().optional() });

/** POST /api/coaching/stripe/verify — Confirm a Stripe checkout on the student's return. */
export const POST = defineRoute(
  { auth: "required", rateLimit: "coachingBooking", body: verifyBodySchema },
  async ({ user, body }) => {
    const { checkoutSessionId } = body;
    if (!checkoutSessionId) throw validationError(undefined, "checkoutSessionId required");

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
  }
);
