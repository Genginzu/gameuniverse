/** Deletion state of the signed-in account (GET /api/account/deletion). */
export interface AccountDeletionStatus {
  pending: boolean;
  requestedAt: string | null;
  scheduledFor: string | null;
}

/** Why a deletion request is refused until the situation is settled. */
export type AccountDeletionBlocker = "coachingPaymentPending" | "coachingDisputeOpen";

/** Error codes returned by POST /api/account/deletion. */
export type AccountDeletionErrorCode =
  | AccountDeletionBlocker
  | "invalidConfirmation"
  | "reauthRequired"
  | "invalidPassword"
  | "alreadyPending";

export interface AccountDeletionRequestPayload {
  password?: string;
  confirmation: string;
  locale: string;
}

/** Row of the admin pending-deletions list. */
export interface PendingAccountDeletion {
  id: string;
  username: string | null;
  avatarUrl: string | null;
  requestedAt: string;
  scheduledFor: string;
}

export interface PendingAccountDeletionsResponse {
  deletions: PendingAccountDeletion[];
}

/** Summary returned by public.purge_account_data. */
export interface AccountPurgeSummary {
  /** Posts, comments, reviews and coaching reviews kept as "Deleted user". */
  anonymisedContent: number;
  retainedCoachingSessions: number;
  transferredGroups: number;
  transferredCommunities: number;
  keptImageUrls: string[];
}

export interface AccountPurgeOutcome {
  userId: string;
  ok: boolean;
  summary?: AccountPurgeSummary;
  removedFiles?: number;
  error?: string;
}
