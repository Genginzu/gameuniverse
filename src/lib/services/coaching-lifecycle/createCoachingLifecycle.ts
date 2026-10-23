import { logger } from "@/lib/logger";
import {
  MAX_CANCELLATION_REASON,
  TRANSITIONS,
  canApply,
  isSessionAction,
  refundOwed,
  roleOf,
  stateOf,
  withPatch,
} from "@/lib/services/coaching-lifecycle/rules";
import { settleRefund } from "@/lib/services/coaching-lifecycle/refunds";
import { recordExternalRefund, recordPayment } from "@/lib/services/coaching-lifecycle/payments";
import type {
  ApplyActionResult,
  CoachingLifecycleDeps,
  ExternalRefundReport,
  LifecycleSession,
  PaymentReport,
  RecordExternalRefundResult,
  RecordPaymentResult,
  RefundOutcome,
  SessionAction,
  SessionPatch,
  SessionRole,
} from "@/types/coaching-lifecycle";

export interface ApplyActionInput {
  sessionId: string;
  actorId: string;
  action: SessionAction;
  cancellationReason?: unknown;
}

export interface CoachingLifecycle {
  applyAction(input: ApplyActionInput): Promise<ApplyActionResult>;
  recordPayment(report: PaymentReport): Promise<RecordPaymentResult>;
  recordExternalRefund(report: ExternalRefundReport): Promise<RecordExternalRefundResult>;
}

const fail = (reason: Extract<ApplyActionResult, { ok: false }>["reason"]): ApplyActionResult => ({
  ok: false,
  reason,
});

async function buildPatch(
  deps: CoachingLifecycleDeps,
  session: LifecycleSession,
  input: ApplyActionInput
): Promise<SessionPatch> {
  const patch: SessionPatch = { status: TRANSITIONS[input.action].to };
  if (input.action !== "cancel" && input.action !== "decline") return patch;

  patch.cancelledBy = input.actorId;
  patch.cancelledAt = new Date().toISOString();
  if (typeof input.cancellationReason === "string" && input.cancellationReason) {
    patch.cancellationReason = input.cancellationReason.slice(0, MAX_CANCELLATION_REASON);
  }
  if (session.paymentStatus === "paid") {
    const refund = refundOwed(session, await deps.store.cancellationPolicy(session.coachId));
    if (refund > 0) Object.assign(patch, { paymentStatus: "refund_pending", refundAmount: refund });
  }
  return patch;
}

async function runEffects(
  deps: CoachingLifecycleDeps,
  session: LifecycleSession,
  input: ApplyActionInput,
  role: SessionRole
): Promise<void> {
  if (input.action === "confirm") {
    try {
      await deps.effects.openConversation(session);
    } catch (error) {
      logger.error("Error creating session conversation", { error, sessionId: session.id });
    }
  }
  const notifyCoach = input.action === "cancel" && role === "student";
  await deps.effects.notifyTransition({
    sessionId: session.id,
    actorId: input.actorId,
    recipientId: notifyCoach ? session.coachPlayerId : session.studentId,
    type: TRANSITIONS[input.action].notification,
  });
}

async function applyAction(
  deps: CoachingLifecycleDeps,
  input: ApplyActionInput
): Promise<ApplyActionResult> {
  if (!isSessionAction(input.action)) return fail("invalid_action");

  const session = await deps.store.load(input.sessionId);
  if (!session) return fail("not_found");

  const rule = TRANSITIONS[input.action];
  const role = roleOf(session, input.actorId);
  if (!role || !rule.roles.includes(role)) return fail("forbidden");
  if (!canApply(rule, session)) return fail("invalid_transition");

  const patch = await buildPatch(deps, session, input);
  if (!(await deps.store.claim(session.id, stateOf(session), patch))) return fail("conflict");

  let current = withPatch(session, patch);
  let refund: RefundOutcome | undefined;
  if (patch.paymentStatus === "refund_pending") {
    ({ outcome: refund, session: current } = await settleRefund(deps, current));
  }

  await runEffects(deps, current, input, role);
  return refund ? { ok: true, session: current, refund } : { ok: true, session: current };
}

/**
 * The coaching session lifecycle: every status and payment-status change, its
 * guards, atomic claims and side effects. Callers are thin adapters (routes,
 * Stripe webhook) translating results to their transport.
 */
export function createCoachingLifecycle(deps: CoachingLifecycleDeps): CoachingLifecycle {
  return {
    applyAction: (input) => applyAction(deps, input),
    recordPayment: (report) => recordPayment(deps, report),
    recordExternalRefund: (report) => recordExternalRefund(deps, report),
  };
}
