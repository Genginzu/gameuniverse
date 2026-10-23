import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

import { createCoachingLifecycle } from "@/lib/services/coaching-lifecycle/createCoachingLifecycle";
import {
  STUDENT_ID,
  aSession,
  createLifecycleHarness,
} from "@/test-helpers/coaching-lifecycle-fakes";
import type { PaymentReport } from "@/types/coaching-lifecycle";

const paidReport = (overrides: Partial<PaymentReport> = {}): PaymentReport => ({
  sessionId: "session-1",
  paid: true,
  amountTotalCents: 4000,
  ...overrides,
});
const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 3600 * 1000).toISOString();
const PI = { pi_1: "session-1" };

describe("recordPayment", () => {
  it("marks a payable session paid and notifies the coach once", async () => {
    const { deps, db, recorded } = createLifecycleHarness([aSession({ status: "confirmed" })]);
    const result = await createCoachingLifecycle(deps).recordPayment(paidReport());
    expect(result).toEqual({ ok: true, outcome: "paid" });
    expect(db.get("session-1")?.paymentStatus).toBe("paid");
    expect(recorded.paid).toEqual([{ sessionId: "session-1", studentId: STUDENT_ID }]);
  });

  it.each([
    ["not_paid", paidReport({ paid: false })],
    ["amount_mismatch", paidReport({ amountTotalCents: 50 })],
    ["forbidden", paidReport({ expectedStudentId: "someone-else" })],
    ["not_found", paidReport({ sessionId: "unknown" })],
  ])("refuses with %s", async (reason, report) => {
    const { deps, db, recorded } = createLifecycleHarness([aSession({ status: "confirmed" })]);
    const result = await createCoachingLifecycle(deps).recordPayment(report);
    expect(result).toEqual({ ok: false, reason });
    expect(db.get("session-1")?.paymentStatus).toBe("pending");
    expect(recorded.paid).toHaveLength(0);
  });

  it("refuses a payment for a session that is not confirmed nor cancelled", async () => {
    const { deps } = createLifecycleHarness([aSession({ status: "requested" })]);
    expect(await createCoachingLifecycle(deps).recordPayment(paidReport())).toEqual({
      ok: false,
      reason: "not_payable",
    });
  });

  it("pays and notifies exactly once when verify and the webhook race", async () => {
    const { deps, db, recorded } = createLifecycleHarness([aSession({ status: "confirmed" })]);
    const lifecycle = createCoachingLifecycle(deps);

    const results = await Promise.all([
      lifecycle.recordPayment(paidReport({ expectedStudentId: STUDENT_ID })),
      lifecycle.recordPayment(paidReport()),
    ]);

    expect(results.map((r) => r.ok && r.outcome).sort()).toEqual(["already_recorded", "paid"]);
    expect(db.get("session-1")?.paymentStatus).toBe("paid");
    expect(recorded.paid).toHaveLength(1);
  });

  it("refunds in full a payment landing on an already cancelled session", async () => {
    const { deps, db, gateway, recorded } = createLifecycleHarness([
      aSession({ status: "cancelled" }),
    ]);
    const result = await createCoachingLifecycle(deps).recordPayment(paidReport());
    expect(result).toEqual({ ok: true, outcome: "refund_started" });
    expect(gateway.refunds).toEqual([
      { sessionId: "session-1", amountCents: 4000, idempotencyKey: "coaching-refund-session-1" },
    ]);
    expect(db.get("session-1")).toMatchObject({ paymentStatus: "refunded", refundAmount: 40 });
    expect(recorded.paid).toHaveLength(0);
  });
});

describe("cancelling a paid session", () => {
  const cancel = { sessionId: "session-1", actorId: STUDENT_ID, action: "cancel" as const };

  it("refunds once following the cancellation policy", async () => {
    const { deps, db, gateway } = createLifecycleHarness([
      aSession({ status: "confirmed", paymentStatus: "paid", scheduledAt: hoursFromNow(10) }),
    ]);
    const result = await createCoachingLifecycle(deps).applyAction(cancel);
    expect(result).toMatchObject({ ok: true, refund: "refunded" });
    expect(gateway.refunds).toEqual([
      { sessionId: "session-1", amountCents: 2000, idempotencyKey: "coaching-refund-session-1" },
    ]);
    expect(db.get("session-1")).toMatchObject({
      status: "cancelled",
      paymentStatus: "refunded",
      refundAmount: 20,
    });
  });

  it("never refunds more than the amount paid, whatever the coach policy says", async () => {
    const { deps, gateway } = createLifecycleHarness(
      [aSession({ status: "confirmed", paymentStatus: "paid", scheduledAt: hoursFromNow(10) })],
      { policies: { "coach-profile": { free_until_hours: 24, partial_refund_percentage: 500, no_refund_after_hours: 2 } } }
    );
    await createCoachingLifecycle(deps).applyAction(cancel);
    expect(gateway.refunds[0]?.amountCents).toBe(4000);
  });

  it("issues a single refund when charge.refunded arrives while the refund is in flight", async () => {
    const { deps, db, gateway } = createLifecycleHarness(
      [aSession({ status: "confirmed", paymentStatus: "paid" })],
      { paymentIntents: PI }
    );
    const lifecycle = createCoachingLifecycle(deps);
    let webhook: Promise<unknown> | null = null;
    gateway.control.duringRefund = () =>
      (webhook = lifecycle.recordExternalRefund({ paymentIntentId: "pi_1", amountRefundedCents: 4000 }));

    const result = await lifecycle.applyAction(cancel);

    expect(await webhook).toBe("refunded");
    expect(result).toMatchObject({ ok: true, refund: "refunded" });
    expect(gateway.refunds).toHaveLength(1);
    expect(db.get("session-1")).toMatchObject({ paymentStatus: "refunded", refundAmount: 40 });
  });

  it("does not refund again after an external refund already settled the payment", async () => {
    const { deps, db, gateway } = createLifecycleHarness(
      [aSession({ status: "confirmed", paymentStatus: "paid" })],
      { paymentIntents: PI }
    );
    const lifecycle = createCoachingLifecycle(deps);
    await lifecycle.recordExternalRefund({ paymentIntentId: "pi_1", amountRefundedCents: 4000 });

    const result = await lifecycle.applyAction(cancel);

    expect(result).toMatchObject({ ok: true, session: { status: "cancelled" } });
    expect(gateway.refunds).toHaveLength(0);
    expect(db.get("session-1")?.paymentStatus).toBe("refunded");
  });

  it("keeps the refund pending when the provider fails, then settles on charge.refunded", async () => {
    const { deps, db, gateway } = createLifecycleHarness(
      [aSession({ status: "confirmed", paymentStatus: "paid" })],
      { paymentIntents: PI }
    );
    const lifecycle = createCoachingLifecycle(deps);
    gateway.control.failRefunds = true;

    const result = await lifecycle.applyAction(cancel);

    expect(result).toMatchObject({ ok: true, refund: "pending" });
    expect(db.get("session-1")).toMatchObject({
      status: "cancelled",
      paymentStatus: "refund_pending",
    });

    expect(
      await lifecycle.recordExternalRefund({ paymentIntentId: "pi_1", amountRefundedCents: 4000 })
    ).toBe("refunded");
    expect(db.get("session-1")?.paymentStatus).toBe("refunded");
  });

  it.each([
    { label: "a late cancellation", scheduledAt: hoursFromNow(1), withoutPolicy: false },
    { label: "a coach without policy", scheduledAt: hoursFromNow(72), withoutPolicy: true },
  ])("keeps the payment for $label", async ({ scheduledAt, withoutPolicy }) => {
    const { deps, db, gateway } = createLifecycleHarness(
      [aSession({ status: "confirmed", paymentStatus: "paid", scheduledAt })],
      withoutPolicy ? { policies: {} } : {}
    );
    const result = await createCoachingLifecycle(deps).applyAction(cancel);
    expect(result).toMatchObject({ ok: true, session: { status: "cancelled" } });
    expect(result.ok && result.refund).toBeFalsy();
    expect(gateway.refunds).toHaveLength(0);
    expect(db.get("session-1")?.paymentStatus).toBe("paid");
  });
});

describe("recordExternalRefund", () => {
  it("records the refunded amount reported by the provider", async () => {
    const { deps, db } = createLifecycleHarness(
      [aSession({ status: "confirmed", paymentStatus: "paid" })],
      { paymentIntents: PI }
    );
    const result = await createCoachingLifecycle(deps).recordExternalRefund({
      paymentIntentId: "pi_1",
      amountRefundedCents: 1500,
    });
    expect(result).toBe("refunded");
    expect(db.get("session-1")).toMatchObject({ paymentStatus: "refunded", refundAmount: 15 });
  });

  it.each([
    ["an unknown payment intent", "pi_unknown", "paid"],
    ["an unpaid session", "pi_1", "pending"],
  ] as const)("ignores %s", async (_label, paymentIntentId, paymentStatus) => {
    const { deps, db } = createLifecycleHarness([aSession({ paymentStatus })], {
      paymentIntents: PI,
    });
    const result = await createCoachingLifecycle(deps).recordExternalRefund({
      paymentIntentId,
      amountRefundedCents: 4000,
    });
    expect(result).toBe("ignored");
    expect(db.get("session-1")?.paymentStatus).toBe(paymentStatus);
  });
});
