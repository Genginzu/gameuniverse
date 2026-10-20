import { describe, it, expect, vi, beforeEach } from "vitest";

const search = vi.fn();
const createRefund = vi.fn();
const updateEq = vi.fn();
const update = vi.fn(() => ({ eq: updateEq }));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    paymentIntents: { search },
    refunds: { create: createRefund },
  }),
}));

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({ from: () => ({ update }) }),
}));

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

import { refundCancelledSession } from "@/lib/services/coachingRefundService";

const inThreeDays = () => new Date(Date.now() + 72 * 3600 * 1000).toISOString();
const policy = { free_until_hours: 24, partial_refund_percentage: 50, no_refund_after_hours: 2 };

describe("refundCancelledSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    search.mockResolvedValue({ data: [{ id: "pi_1" }] });
    createRefund.mockResolvedValue({});
    updateEq.mockResolvedValue({ error: null });
  });

  it("does nothing when the session was not paid", async () => {
    await refundCancelledSession(
      { id: "s1", scheduled_at: inThreeDays(), payment_amount: 40, payment_status: "pending" },
      policy
    );
    expect(createRefund).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("refunds with an idempotency key and records it with the service role", async () => {
    await refundCancelledSession(
      { id: "s1", scheduled_at: inThreeDays(), payment_amount: 40, payment_status: "paid" },
      policy
    );
    expect(createRefund).toHaveBeenCalledWith(
      { payment_intent: "pi_1", amount: 4000 },
      { idempotencyKey: "coaching-refund-s1" }
    );
    expect(update).toHaveBeenCalledWith({ refund_amount: 40, payment_status: "refunded" });
  });

  it("never refunds more than the amount paid, whatever the coach policy says", async () => {
    await refundCancelledSession(
      { id: "s1", scheduled_at: new Date(Date.now() + 10 * 3600 * 1000).toISOString(), payment_amount: 40, payment_status: "paid" },
      { free_until_hours: 24, partial_refund_percentage: 500, no_refund_after_hours: 2 }
    );
    expect(createRefund).toHaveBeenCalledWith(
      { payment_intent: "pi_1", amount: 4000 },
      { idempotencyKey: "coaching-refund-s1" }
    );
  });
});
