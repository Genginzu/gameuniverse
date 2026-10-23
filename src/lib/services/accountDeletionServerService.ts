import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { computeDeletionSchedule } from "@/lib/utils/accountDeletion";
import type {
  AccountDeletionBlocker,
  AccountDeletionStatus,
  PendingAccountDeletion,
} from "@/types/account-deletion";

/**
 * Server-only account deletion state (issue #378). The deletion columns on
 * profiles are frozen for interactive callers, so every write goes through
 * the service-role client after the route has authenticated the user.
 */

interface DeletionRow {
  id: string;
  username: string | null;
  avatar_url: string | null;
  deletion_requested_at: string | null;
  deletion_scheduled_for: string | null;
}

const NOT_PENDING: AccountDeletionStatus = {
  pending: false,
  requestedAt: null,
  scheduledFor: null,
};

function toStatus(
  row: Pick<DeletionRow, "deletion_requested_at" | "deletion_scheduled_for"> | null
) {
  if (!row?.deletion_requested_at) return NOT_PENDING;
  return {
    pending: true,
    requestedAt: row.deletion_requested_at,
    scheduledFor: row.deletion_scheduled_for,
  } satisfies AccountDeletionStatus;
}

export async function getDeletionStatus(userId: string): Promise<AccountDeletionStatus> {
  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .select("deletion_requested_at, deletion_scheduled_for")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return toStatus(data as DeletionRow | null);
}

/** Money held in escrow, a refund still owed, or an open dispute must be settled before deletion. */
export async function findDeletionBlocker(userId: string): Promise<AccountDeletionBlocker | null> {
  const admin = getSupabaseAdmin();

  const { data: coachRows, error: coachError } = await admin
    .from("coach_profiles")
    .select("id")
    .eq("player_id", userId);
  if (coachError) throw new Error(coachError.message);

  const coachIds = ((coachRows ?? []) as Array<{ id: string }>).map((row) => row.id);
  const parties = [`student_id.eq.${userId}`, ...coachIds.map((id) => `coach_id.eq.${id}`)];

  const { count: heldPayments, error: sessionError } = await admin
    .from("coaching_sessions")
    .select("id", { count: "exact", head: true })
    .in("payment_status", ["paid", "refund_pending"])
    .or(parties.join(","));
  if (sessionError) throw new Error(sessionError.message);
  if ((heldPayments ?? 0) > 0) return "coachingPaymentPending";

  const { count: openDisputes, error: disputeError } = await admin
    .from("coaching_disputes")
    .select("id", { count: "exact", head: true })
    .in("status", ["open", "investigating"])
    .or(`reporter_id.eq.${userId},reported_id.eq.${userId}`);
  if (disputeError) throw new Error(disputeError.message);
  if ((openDisputes ?? 0) > 0) return "coachingDisputeOpen";

  return null;
}

/** Deactivates the account. Returns null when a deletion is already pending. */
export async function requestDeletion(
  userId: string,
  now: Date = new Date()
): Promise<AccountDeletionStatus | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .update({
      deletion_requested_at: now.toISOString(),
      deletion_scheduled_for: computeDeletionSchedule(now).toISOString(),
    })
    .eq("id", userId)
    .is("deletion_requested_at", null)
    .select("deletion_requested_at, deletion_scheduled_for")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toStatus(data as DeletionRow) : null;
}

/** Restores the account. Returns false when no deletion was pending. */
export async function cancelDeletion(userId: string): Promise<boolean> {
  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .update({ deletion_requested_at: null, deletion_scheduled_for: null })
    .eq("id", userId)
    .not("deletion_requested_at", "is", null)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function listPendingDeletions(): Promise<PendingAccountDeletion[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .select("id, username, avatar_url, deletion_requested_at, deletion_scheduled_for")
    .not("deletion_requested_at", "is", null)
    .order("deletion_scheduled_for", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as DeletionRow[]).map((row) => ({
    id: row.id,
    username: row.username,
    avatarUrl: row.avatar_url,
    requestedAt: row.deletion_requested_at ?? "",
    scheduledFor: row.deletion_scheduled_for ?? "",
  }));
}

/** Accounts whose grace period is over, oldest first. */
export async function listDueDeletions(limit: number, now: Date = new Date()): Promise<string[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .select("id")
    .not("deletion_requested_at", "is", null)
    .lte("deletion_scheduled_for", now.toISOString())
    .order("deletion_scheduled_for", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<{ id: string }>).map((row) => row.id);
}
