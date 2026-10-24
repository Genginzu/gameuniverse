import { describe, it, expect, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";
import { createSupabaseSessionStore } from "@/lib/services/coaching-lifecycle/supabaseSessionStore";

const db = createSupabaseQueryMock();
const store = createSupabaseSessionStore(db.client as unknown as SupabaseClient);

describe("createSupabaseSessionStore", () => {
  beforeEach(() => db.reset());

  it("claims only when the row is still in the expected status and payment status", async () => {
    db.enqueue("coaching_sessions", { data: { id: "s1" } });

    const claimed = await store.claim(
      "s1",
      { status: "confirmed", paymentStatus: "paid" },
      { status: "cancelled", paymentStatus: "refund_pending", refundAmount: 20, cancelledBy: "u1" }
    );

    expect(claimed).toBe(true);
    expect(db.callsFor("coaching_sessions", "update")[0]).toEqual([
      { status: "cancelled", payment_status: "refund_pending", refund_amount: 20, cancelled_by: "u1" },
    ]);
    expect(db.callsFor("coaching_sessions", "eq")).toEqual([
      ["id", "s1"],
      ["status", "confirmed"],
      ["payment_status", "paid"],
    ]);
  });

  it("reports a lost claim when no row matched", async () => {
    db.enqueue("coaching_sessions", { data: null });
    expect(
      await store.claim("s1", { status: "confirmed", paymentStatus: "pending" }, { paymentStatus: "paid" })
    ).toBe(false);
  });

  it("throws on a database error instead of reporting a lost claim", async () => {
    db.enqueue("coaching_sessions", { error: { message: "boom" } });
    await expect(
      store.claim("s1", { status: "confirmed", paymentStatus: "pending" }, { paymentStatus: "paid" })
    ).rejects.toThrow("boom");
  });

  it("loads a session with its coach player id and numeric amounts", async () => {
    db.enqueue("coaching_sessions", {
      data: {
        id: "s1",
        coach_id: "c1",
        student_id: "u1",
        status: "confirmed",
        payment_status: "paid",
        payment_amount: "40.00",
        refund_amount: null,
        scheduled_at: "2026-11-01T10:00:00Z",
      },
    });
    db.enqueue("coach_profiles", { data: { player_id: "coach-player" } });

    expect(await store.load("s1")).toEqual({
      id: "s1",
      coachId: "c1",
      coachPlayerId: "coach-player",
      studentId: "u1",
      status: "confirmed",
      paymentStatus: "paid",
      paymentAmount: 40,
      refundAmount: null,
      scheduledAt: "2026-11-01T10:00:00Z",
    });
  });
});
