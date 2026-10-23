import type { SupabaseClient } from "@supabase/supabase-js";
import type { CancellationPolicy } from "@/types/coaching";
import type {
  LifecycleSession,
  PaymentStatus,
  SessionPatch,
  SessionStatus,
  SessionStore,
} from "@/types/coaching-lifecycle";

const SESSION_COLUMNS =
  "id, coach_id, student_id, status, payment_status, payment_amount, refund_amount, scheduled_at";

interface SessionRow {
  id: string;
  coach_id: string;
  student_id: string;
  status: SessionStatus;
  payment_status: PaymentStatus;
  payment_amount: number | string | null;
  refund_amount: number | string | null;
  scheduled_at: string;
}

const toNumber = (value: number | string | null) => (value === null ? null : Number(value));

function toRow(patch: SessionPatch): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.status) row.status = patch.status;
  if (patch.paymentStatus) row.payment_status = patch.paymentStatus;
  if (patch.refundAmount !== undefined) row.refund_amount = patch.refundAmount;
  if (patch.cancelledBy) row.cancelled_by = patch.cancelledBy;
  if (patch.cancelledAt) row.cancelled_at = patch.cancelledAt;
  if (patch.cancellationReason) row.cancellation_reason = patch.cancellationReason;
  return row;
}

/**
 * SessionStore over Supabase. Uses the service role: payment columns are
 * server-only, and the lifecycle module enforces roles and transitions itself
 * (the DB trigger stays as a guard for direct PostgREST callers).
 */
export function createSupabaseSessionStore(admin: SupabaseClient): SessionStore {
  async function coachPlayerId(coachId: string): Promise<string | null> {
    const { data, error } = await admin
      .from("coach_profiles")
      .select("player_id")
      .eq("id", coachId)
      .maybeSingle();
    if (error) throw new Error(`Failed to load coach profile: ${error.message}`);
    return (data?.player_id as string | undefined) ?? null;
  }

  return {
    async load(sessionId) {
      const { data, error } = await admin
        .from("coaching_sessions")
        .select(SESSION_COLUMNS)
        .eq("id", sessionId)
        .maybeSingle();
      if (error) throw new Error(`Failed to load coaching session: ${error.message}`);
      if (!data) return null;
      const row = data as unknown as SessionRow;
      const session: LifecycleSession = {
        id: row.id,
        coachId: row.coach_id,
        coachPlayerId: await coachPlayerId(row.coach_id),
        studentId: row.student_id,
        status: row.status,
        paymentStatus: row.payment_status,
        paymentAmount: toNumber(row.payment_amount),
        refundAmount: toNumber(row.refund_amount),
        scheduledAt: row.scheduled_at,
      };
      return session;
    },

    async claim(sessionId, expected, patch) {
      const { data, error } = await admin
        .from("coaching_sessions")
        .update(toRow(patch))
        .eq("id", sessionId)
        .eq("status", expected.status)
        .eq("payment_status", expected.paymentStatus)
        .select("id")
        .maybeSingle();
      if (error) throw new Error(`Failed to update coaching session: ${error.message}`);
      return !!data;
    },

    async cancellationPolicy(coachId) {
      const { data, error } = await admin
        .from("coach_profiles")
        .select("cancellation_policy")
        .eq("id", coachId)
        .maybeSingle();
      if (error) throw new Error(`Failed to load cancellation policy: ${error.message}`);
      return (data?.cancellation_policy as CancellationPolicy | null | undefined) ?? null;
    },
  };
}
