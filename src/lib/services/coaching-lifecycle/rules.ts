import { calculateRefund } from "@/lib/services/cancellationService";
import type { CancellationPolicy } from "@/types/coaching";
import type { CoachingTransitionNotificationType } from "@/types/notification";
import type {
  LifecycleSession,
  PaymentStatus,
  SessionAction,
  SessionPatch,
  SessionRole,
  SessionState,
  SessionStatus,
} from "@/types/coaching-lifecycle";

interface TransitionRule {
  from: SessionStatus[];
  to: SessionStatus;
  roles: SessionRole[];
  /** Payment states the session must be in; any when omitted. */
  payment?: PaymentStatus[];
  notification: CoachingTransitionNotificationType;
}

export const TRANSITIONS: Record<SessionAction, TransitionRule> = {
  confirm: { from: ["requested"], to: "confirmed", roles: ["coach"], notification: "coaching_confirmed" },
  decline: { from: ["requested"], to: "cancelled", roles: ["coach"], notification: "coaching_declined" },
  start: {
    from: ["confirmed"],
    to: "in_progress",
    roles: ["coach"],
    payment: ["paid"],
    notification: "coaching_started",
  },
  complete: { from: ["in_progress"], to: "completed", roles: ["coach"], notification: "coaching_completed" },
  cancel: {
    from: ["requested", "confirmed"],
    to: "cancelled",
    roles: ["coach", "student"],
    notification: "coaching_cancelled",
  },
};

export const MAX_CANCELLATION_REASON = 1000;

export function isSessionAction(value: unknown): value is SessionAction {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(TRANSITIONS, value);
}

export function roleOf(session: LifecycleSession, actorId: string): SessionRole | null {
  if (session.studentId === actorId) return "student";
  if (session.coachPlayerId && session.coachPlayerId === actorId) return "coach";
  return null;
}

export function canApply(rule: TransitionRule, session: SessionState): boolean {
  if (!rule.from.includes(session.status)) return false;
  return !rule.payment || rule.payment.includes(session.paymentStatus);
}

/** A confirmed session still waiting for the student's payment. */
export function isPayableSession(session: SessionState): boolean {
  return session.status === "confirmed" && session.paymentStatus === "pending";
}

export function stateOf(session: LifecycleSession): SessionState {
  return { status: session.status, paymentStatus: session.paymentStatus };
}

/** Refund owed when a paid session is cancelled now, clamped to what was paid. */
export function refundOwed(session: LifecycleSession, policy: CancellationPolicy | null): number {
  const paid = Number(session.paymentAmount ?? 0);
  if (!policy || session.paymentStatus !== "paid" || paid <= 0) return 0;
  const { refundAmount } = calculateRefund(policy, session.scheduledAt, paid);
  return Math.min(Math.max(refundAmount, 0), paid);
}

export function expectedCents(session: LifecycleSession): number {
  return Math.round(Number(session.paymentAmount ?? 0) * 100);
}

export function withPatch(session: LifecycleSession, patch: SessionPatch): LifecycleSession {
  return {
    ...session,
    status: patch.status ?? session.status,
    paymentStatus: patch.paymentStatus ?? session.paymentStatus,
    refundAmount: patch.refundAmount ?? session.refundAmount,
  };
}
