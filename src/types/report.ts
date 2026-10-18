/**
 * Types for the content reporting system (issue #172).
 * Users flag inappropriate content; admins moderate the report queue.
 */

/** Categories of content that can be reported. */
export type ReportContentType = "review" | "post" | "comment" | "profile";

/** Reason a user selects when reporting content. */
export type ReportReason = "spam" | "harassment" | "inappropriate" | "other";

/** Lifecycle status of a report in the moderation queue. */
export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

/** Moderation action applied when an admin resolves a report. */
export type ReportAction = "none" | "content_deleted" | "author_warned" | "author_suspended";

/** Admin decision applied to a report. */
export type ReportDecision = "review" | "resolve" | "dismiss";

/** Payload sent by a user when creating a report. */
export interface CreateReportInput {
  contentType: ReportContentType;
  contentId: string;
  reason: ReportReason;
  description?: string | null;
}

/** Snapshot of the reported content shown to moderators. */
export interface ReportContentPreview {
  /** False when the content has been deleted since it was reported. */
  exists: boolean;
  /** Plain-text excerpt of the content (username for profiles). */
  text: string | null;
  authorId: string | null;
  authorName: string | null;
  /** In-app path to view the content in context, when resolvable. */
  href: string | null;
}

/** A report as returned to clients. */
export interface ContentReport {
  id: string;
  reporterId: string;
  contentType: ReportContentType;
  contentId: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  resolvedBy: string | null;
  resolvedAt: string | null;
  actionTaken: ReportAction | null;
  createdAt: string;
  reporter?: {
    username: string | null;
    avatarUrl: string | null;
  };
  /** Only populated for the admin queue. */
  content?: ReportContentPreview;
}

/** Response shape for the admin report list endpoint. */
export interface ReportsResponse {
  reports: ContentReport[];
}

/** A report as seen by its own author (used to show the "already reported" state). */
export interface MyReport {
  id: string;
  contentType: ReportContentType;
  contentId: string;
  status: ReportStatus;
  /** True while the report is still open and can be withdrawn by its author. */
  cancellable: boolean;
}

/** Response shape for the current user's report list endpoint. */
export interface MyReportsResponse {
  reports: MyReport[];
}

/** Payload sent by an admin to resolve or dismiss a report. */
export interface ResolveReportInput {
  decision: ReportDecision;
  actionTaken?: ReportAction;
  adminNotes?: string;
  /** Required range for author_suspended: SUSPENSION_DAYS.MIN..MAX. */
  suspensionDays?: number;
}

/** Options applied when resolving a report. */
export interface ModerationOptions {
  suspensionDays?: number;
}

export const SUSPENSION_DAYS = { MIN: 1, MAX: 365, DEFAULT: 7 } as const;

/** Suspension status of the signed-in user (GET /api/players/me/suspension). */
export interface MySuspensionResponse {
  suspended: boolean;
  /** ISO end date; null while suspended means "until further notice". */
  until: string | null;
}

export const MAX_REPORTS_PER_DAY = 20;
