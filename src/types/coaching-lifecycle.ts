import type { CancellationPolicy } from "@/types/coaching";
import type { CoachingTransitionNotificationType } from "@/types/notification";

export type SessionStatus =
  | "requested"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed";

export type PaymentStatus = "pending" | "paid" | "refund_pending" | "refunded" | "released";

export type SessionAction = "confirm" | "decline" | "start" | "complete" | "cancel";

export type SessionRole = "coach" | "student";

/** The slice of a coaching session the lifecycle reasons about. */
export interface LifecycleSession {
  id: string;
  coachId: string;
  coachPlayerId: string | null;
  studentId: string;
  status: SessionStatus;
  paymentStatus: PaymentStatus;
  paymentAmount: number | null;
  refundAmount: number | null;
  scheduledAt: string;
}

/** Both axes a claim compares against; a claim always pins the full current state. */
export interface SessionState {
  status: SessionStatus;
  paymentStatus: PaymentStatus;
}

export interface SessionPatch {
  status?: SessionStatus;
  paymentStatus?: PaymentStatus;
  refundAmount?: number;
  cancelledBy?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

/** Persistence port. `claim` is a compare-and-set: it applies `patch` only if the row is still in `expected`. */
export interface SessionStore {
  load(sessionId: string): Promise<LifecycleSession | null>;
  claim(sessionId: string, expected: SessionState, patch: SessionPatch): Promise<boolean>;
  cancellationPolicy(coachId: string): Promise<CancellationPolicy | null>;
}

/** Payment provider port (Stripe in production). */
export interface PaymentGateway {
  /** Refund `amountCents` of the session payment. Must be idempotent on `idempotencyKey`. */
  refund(input: { sessionId: string; amountCents: number; idempotencyKey: string }): Promise<void>;
  sessionIdForPaymentIntent(paymentIntentId: string): Promise<string | null>;
}

/** Side effects of a transition: conversation and notifications. */
export interface LifecycleEffects {
  openConversation(session: LifecycleSession): Promise<void>;
  notifyTransition(input: {
    sessionId: string;
    actorId: string;
    recipientId: string | null;
    type: CoachingTransitionNotificationType;
  }): Promise<void>;
  notifyPaid(input: { sessionId: string; studentId: string }): Promise<void>;
}

export interface CoachingLifecycleDeps {
  store: SessionStore;
  payments: PaymentGateway;
  effects: LifecycleEffects;
}

export type RefundOutcome = "refunded" | "pending";

export type ApplyActionResult =
  | { ok: true; session: LifecycleSession; refund?: RefundOutcome }
  | {
      ok: false;
      reason: "invalid_action" | "not_found" | "forbidden" | "invalid_transition" | "conflict";
    };

/** What the payment provider reports about a checkout, already verified server-side. */
export interface PaymentReport {
  sessionId: string;
  paid: boolean;
  amountTotalCents: number | null;
  /** Set by the student-facing confirmation: the caller must be the session student. */
  expectedStudentId?: string;
}

export type RecordPaymentResult =
  | { ok: true; outcome: "paid" | "already_recorded" | "refund_started" }
  | { ok: false; reason: "not_paid" | "not_found" | "forbidden" | "amount_mismatch" | "not_payable" };

export interface ExternalRefundReport {
  paymentIntentId: string;
  amountRefundedCents: number;
}

export type RecordExternalRefundResult = "refunded" | "ignored";
