import { describe, it, expect, vi, beforeEach } from "vitest";
import type Stripe from "stripe";

vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock("@/lib/stripe", () => ({ getStripe: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn() } }));

import { claimEvent, handleStripeEvent } from "@/lib/services/stripeWebhookService";

function makeDb(session: { payment_amount: number; payment_status: string } | null) {
  const updateEqStatus = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn(() => ({ eq: vi.fn(() => ({ eq: updateEqStatus })) }));
  const maybeSingle = vi.fn().mockResolvedValue({ data: session, error: null });
  const select = vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) }));
  const insert = vi.fn();
  const db = { from: vi.fn(() => ({ select, update, insert })) };
  return { db, update, insert };
}

function checkoutEvent(payment_status: string, amount_total: number): Stripe.Event {
  return {
    id: "evt_1",
    type: "checkout.session.completed",
    data: {
      object: { payment_status, amount_total, metadata: { coaching_session_id: "s1" } },
    },
  } as unknown as Stripe.Event;
}

describe("handleStripeEvent — checkout.session.completed", () => {
  beforeEach(() => vi.clearAllMocks());

  it("marks a pending session paid when Stripe says paid and the amount matches", async () => {
    const { db, update } = makeDb({ payment_amount: 40, payment_status: "pending" });
    await handleStripeEvent(checkoutEvent("paid", 4000), db);
    expect(update).toHaveBeenCalledWith({ payment_status: "paid" });
  });

  it("ignores an unpaid checkout (async payment still pending)", async () => {
    const { db, update } = makeDb({ payment_amount: 40, payment_status: "pending" });
    await handleStripeEvent(checkoutEvent("unpaid", 4000), db);
    expect(update).not.toHaveBeenCalled();
  });

  it("refuses to mark paid when the charged amount differs from the session price", async () => {
    const { db, update } = makeDb({ payment_amount: 40, payment_status: "pending" });
    await handleStripeEvent(checkoutEvent("paid", 50), db);
    expect(update).not.toHaveBeenCalled();
  });

  it("does nothing for a session that is no longer pending", async () => {
    const { db, update } = makeDb({ payment_amount: 40, payment_status: "refunded" });
    await handleStripeEvent(checkoutEvent("paid", 4000), db);
    expect(update).not.toHaveBeenCalled();
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
