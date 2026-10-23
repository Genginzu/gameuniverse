import { describe, it, expect, vi } from "vitest";
import type Stripe from "stripe";

vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock("@/lib/stripe", () => ({ getStripe: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn() } }));

import { claimEvent, handleStripeEvent } from "@/lib/services/stripeWebhookService";
import { createCoachingLifecycle } from "@/lib/services/coaching-lifecycle";
import { aSession, createLifecycleHarness } from "@/test-helpers/coaching-lifecycle-fakes";

function checkoutEvent(payment_status: string, amount_total: number): Stripe.Event {
  return {
    id: "evt_1",
    type: "checkout.session.completed",
    data: {
      object: { payment_status, amount_total, metadata: { coaching_session_id: "session-1" } },
    },
  } as unknown as Stripe.Event;
}

function refundEvent(amount_refunded: number): Stripe.Event {
  return {
    id: "evt_2",
    type: "charge.refunded",
    data: { object: { payment_intent: "pi_1", amount_refunded } },
  } as unknown as Stripe.Event;
}

function harness(paymentStatus: "pending" | "paid" = "pending") {
  const h = createLifecycleHarness([aSession({ status: "confirmed", paymentStatus })], {
    paymentIntents: { pi_1: "session-1" },
  });
  return { ...h, lifecycle: createCoachingLifecycle(h.deps) };
}

describe("handleStripeEvent — adapter onto the coaching lifecycle", () => {
  it("records a paid checkout and notifies the coach", async () => {
    const { lifecycle, db, recorded } = harness();
    await handleStripeEvent(checkoutEvent("paid", 4000), {}, lifecycle);
    expect(db.get("session-1")?.paymentStatus).toBe("paid");
    expect(recorded.paid).toHaveLength(1);
  });

  it("ignores an unpaid checkout (async payment still pending)", async () => {
    const { lifecycle, db } = harness();
    await handleStripeEvent(checkoutEvent("unpaid", 4000), {}, lifecycle);
    expect(db.get("session-1")?.paymentStatus).toBe("pending");
  });

  it("records charge.refunded with the amount reported by Stripe", async () => {
    const { lifecycle, db } = harness("paid");
    await handleStripeEvent(refundEvent(4000), {}, lifecycle);
    expect(db.get("session-1")).toMatchObject({ paymentStatus: "refunded", refundAmount: 40 });
  });
});

describe("claimEvent", () => {
  it("reports a replayed event id as duplicate", async () => {
    const insert = vi.fn().mockResolvedValue({ error: { code: "23505", message: "duplicate" } });
    const db = { from: vi.fn(() => ({ insert })) };
    expect(await claimEvent(db, checkoutEvent("paid", 4000))).toBe("duplicate");
  });

  it("claims a new event id", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const db = { from: vi.fn(() => ({ insert })) };
    expect(await claimEvent(db, checkoutEvent("paid", 4000))).toBe("claimed");
    expect(insert).toHaveBeenCalledWith({ id: "evt_1", type: "checkout.session.completed" });
  });
});
