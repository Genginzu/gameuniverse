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
}

/** Response shape for the admin report list endpoint. */
export interface ReportsResponse {
  reports: ContentReport[];
}

/** Payload sent by an admin to resolve or dismiss a report. */
export interface ResolveReportInput {
  decision: ReportDecision;
  actionTaken?: ReportAction;
  adminNotes?: string;
}

export const MAX_REPORTS_PER_DAY = 20;
