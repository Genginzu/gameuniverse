import type { CancellationPolicy } from "@/types/coaching";
import type {
  CoachingLifecycleDeps,
  LifecycleEffects,
  LifecycleSession,
  PaymentGateway,
  SessionPatch,
  SessionState,
  SessionStore,
} from "@/types/coaching-lifecycle";

/** Yield to the event loop so concurrent operations interleave like real I/O. */
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** In-memory SessionStore honouring the compare-and-set semantics of `claim`. */
export function createInMemorySessionStore(
  sessions: LifecycleSession[] = [],
  policies: Record<string, CancellationPolicy> = {}
) {
  const rows = new Map(sessions.map((session) => [session.id, { ...session }]));
  const store: SessionStore = {
    async load(sessionId) {
      await tick();
      const row = rows.get(sessionId);
      return row ? { ...row } : null;
    },
    async claim(sessionId: string, expected: SessionState, patch: SessionPatch) {
      await tick();
      const row = rows.get(sessionId);
      if (!row || row.status !== expected.status || row.paymentStatus !== expected.paymentStatus) {
        return false;
      }
      rows.set(sessionId, {
        ...row,
        ...(patch.status && { status: patch.status }),
        ...(patch.paymentStatus && { paymentStatus: patch.paymentStatus }),
        ...(patch.refundAmount !== undefined && { refundAmount: patch.refundAmount }),
      });
      return true;
    },
    async cancellationPolicy(coachId) {
      await tick();
      return policies[coachId] ?? null;
    },
  };
  return { store, get: (sessionId: string) => rows.get(sessionId) };
}

interface RecordedRefund {
  sessionId: string;
  amountCents: number;
  idempotencyKey: string;
}

/** Fake PaymentGateway: records refunds, deduplicates by idempotency key like Stripe. */
export function createFakePaymentGateway(paymentIntents: Record<string, string> = {}) {
  const refunds: RecordedRefund[] = [];
  const seenKeys = new Set<string>();
  const control = {
    failRefunds: false,
    /** Runs while a refund is in flight, before it resolves. */
    duringRefund: null as null | (() => Promise<unknown>),
  };
  const payments: PaymentGateway = {
    async refund(input) {
      await tick();
      if (control.failRefunds) throw new Error("Stripe unavailable");
      if (!seenKeys.has(input.idempotencyKey)) {
        seenKeys.add(input.idempotencyKey);
        refunds.push(input);
      }
      if (control.duringRefund) await control.duringRefund();
    },
    async sessionIdForPaymentIntent(paymentIntentId) {
      await tick();
      return paymentIntents[paymentIntentId] ?? null;
    },
  };
  return { payments, refunds, control };
}

/** Recording LifecycleEffects. */
export function createRecordingEffects() {
  const conversations: string[] = [];
  const transitions: Array<Parameters<LifecycleEffects["notifyTransition"]>[0]> = [];
  const paid: Array<Parameters<LifecycleEffects["notifyPaid"]>[0]> = [];
  const effects: LifecycleEffects = {
    async openConversation(session) {
      conversations.push(session.id);
    },
    async notifyTransition(input) {
      transitions.push(input);
    },
    async notifyPaid(input) {
      paid.push(input);
    },
  };
  return { effects, conversations, transitions, paid };
}

export const STUDENT_ID = "student-player";
export const COACH_PLAYER_ID = "coach-player";
export const COACH_ID = "coach-profile";

export function aSession(overrides: Partial<LifecycleSession> = {}): LifecycleSession {
  return {
    id: "session-1",
    coachId: COACH_ID,
    coachPlayerId: COACH_PLAYER_ID,
    studentId: STUDENT_ID,
    status: "requested",
    paymentStatus: "pending",
    paymentAmount: 40,
    refundAmount: null,
    scheduledAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    ...overrides,
  };
}

/** Full-refund-before-24h policy. */
export const FLEXIBLE_POLICY: CancellationPolicy = {
  free_until_hours: 24,
  partial_refund_percentage: 50,
  no_refund_after_hours: 2,
};

export function createLifecycleHarness(
  sessions: LifecycleSession[],
  options: {
    policies?: Record<string, CancellationPolicy>;
    paymentIntents?: Record<string, string>;
  } = {}
) {
  const db = createInMemorySessionStore(sessions, options.policies ?? { [COACH_ID]: FLEXIBLE_POLICY });
  const gateway = createFakePaymentGateway(options.paymentIntents);
  const recorded = createRecordingEffects();
  const deps: CoachingLifecycleDeps = {
    store: db.store,
    payments: gateway.payments,
    effects: recorded.effects,
  };
  return { deps, db, gateway, recorded };
}
