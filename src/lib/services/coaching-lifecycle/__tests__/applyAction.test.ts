import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

import { createCoachingLifecycle } from "@/lib/services/coaching-lifecycle/createCoachingLifecycle";
import {
  COACH_PLAYER_ID,
  STUDENT_ID,
  aSession,
  createLifecycleHarness,
} from "@/test-helpers/coaching-lifecycle-fakes";
import type {
  PaymentStatus,
  SessionAction,
  SessionRole,
  SessionStatus,
} from "@/types/coaching-lifecycle";

type State = `${SessionStatus}/${PaymentStatus}`;

const STATES: State[] = [
  "requested/pending",
  "confirmed/pending",
  "confirmed/paid",
  "in_progress/paid",
  "completed/paid",
  "cancelled/pending",
  "cancelled/refunded",
];
const ACTIONS: SessionAction[] = ["confirm", "decline", "start", "complete", "cancel"];
const ROLES: SessionRole[] = ["coach", "student"];

/** The specification: every allowed (action, role, starting state) and the status it leads to. */
const ALLOWED: Record<string, SessionStatus> = {
  "confirm|coach|requested/pending": "confirmed",
  "decline|coach|requested/pending": "cancelled",
  "start|coach|confirmed/paid": "in_progress",
  "complete|coach|in_progress/paid": "completed",
  "cancel|coach|requested/pending": "cancelled",
  "cancel|coach|confirmed/pending": "cancelled",
  "cancel|coach|confirmed/paid": "cancelled",
  "cancel|student|requested/pending": "cancelled",
  "cancel|student|confirmed/pending": "cancelled",
  "cancel|student|confirmed/paid": "cancelled",
};

const COACH_ONLY: SessionAction[] = ["confirm", "decline", "start", "complete"];
const actorFor = (role: SessionRole) => (role === "coach" ? COACH_PLAYER_ID : STUDENT_ID);

const cases = ACTIONS.flatMap((action) =>
  ROLES.flatMap((role) => STATES.map((state) => ({ action, role, state })))
);

describe("applyAction — action x role x starting state", () => {
  it.each(cases)("$action by $role from $state", async ({ action, role, state }) => {
    const [status, paymentStatus] = state.split("/") as [SessionStatus, PaymentStatus];
    const { deps, db } = createLifecycleHarness([aSession({ status, paymentStatus })]);
    const lifecycle = createCoachingLifecycle(deps);

    const result = await lifecycle.applyAction({
      sessionId: "session-1",
      actorId: actorFor(role),
      action,
    });

    const target = ALLOWED[`${action}|${role}|${state}`];
    if (target) {
      expect(result).toMatchObject({ ok: true, session: { status: target } });
      expect(db.get("session-1")?.status).toBe(target);
    } else {
      const reason =
        role === "student" && COACH_ONLY.includes(action) ? "forbidden" : "invalid_transition";
      expect(result).toEqual({ ok: false, reason });
      expect(db.get("session-1")?.status).toBe(status);
    }
  });
});

describe("applyAction — refusals and effects", () => {
  it("rejects an unknown action", async () => {
    const { deps } = createLifecycleHarness([aSession()]);
    const result = await createCoachingLifecycle(deps).applyAction({
      sessionId: "session-1",
      actorId: COACH_PLAYER_ID,
      action: "pay" as SessionAction,
    });
    expect(result).toEqual({ ok: false, reason: "invalid_action" });
  });

  it("returns not_found for an unknown session and forbidden for a non-participant", async () => {
    const lifecycle = createCoachingLifecycle(createLifecycleHarness([aSession()]).deps);
    expect(
      await lifecycle.applyAction({ sessionId: "nope", actorId: STUDENT_ID, action: "cancel" })
    ).toEqual({ ok: false, reason: "not_found" });
    expect(
      await lifecycle.applyAction({ sessionId: "session-1", actorId: "stranger", action: "cancel" })
    ).toEqual({ ok: false, reason: "forbidden" });
  });

  it("applies a concurrent double confirm exactly once", async () => {
    const { deps, recorded } = createLifecycleHarness([aSession()]);
    const lifecycle = createCoachingLifecycle(deps);
    const input = { sessionId: "session-1", actorId: COACH_PLAYER_ID, action: "confirm" as const };

    const results = await Promise.all([lifecycle.applyAction(input), lifecycle.applyAction(input)]);

    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok)).toEqual([{ ok: false, reason: "conflict" }]);
    expect(recorded.conversations).toEqual(["session-1"]);
    expect(recorded.transitions).toHaveLength(1);
  });

  it("opens the conversation on confirm and notifies the student", async () => {
    const { deps, recorded } = createLifecycleHarness([aSession()]);
    await createCoachingLifecycle(deps).applyAction({
      sessionId: "session-1",
      actorId: COACH_PLAYER_ID,
      action: "confirm",
    });
    expect(recorded.conversations).toEqual(["session-1"]);
    expect(recorded.transitions).toEqual([
      {
        sessionId: "session-1",
        actorId: COACH_PLAYER_ID,
        recipientId: STUDENT_ID,
        type: "coaching_confirmed",
      },
    ]);
  });

  it("notifies the coach when the student cancels", async () => {
    const { deps, recorded } = createLifecycleHarness([aSession({ status: "confirmed" })]);
    await createCoachingLifecycle(deps).applyAction({
      sessionId: "session-1",
      actorId: STUDENT_ID,
      action: "cancel",
    });
    expect(recorded.transitions[0]).toMatchObject({
      recipientId: COACH_PLAYER_ID,
      type: "coaching_cancelled",
    });
  });
});
