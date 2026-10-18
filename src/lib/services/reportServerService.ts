import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import { applyModerationAction } from "@/lib/services/reportModerationActions";
import { withContentPreviews } from "@/lib/services/reportContentPreview";
import {
  MAX_REPORTS_PER_DAY,
  type ContentReport,
  type CreateReportInput,
  type ModerationOptions,
  type ReportAction,
  type ReportContentType,
  type ReportStatus,
} from "@/types/report";

// content_reports is not present in the generated Supabase types yet
// (migration applied but types not regenerated), mirroring the disputes/
// notifications approach.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedClient = any;

const OPEN_STATUSES: ReportStatus[] = ["pending", "reviewed"];

interface ReportRow {
  id: string;
  reporter_id: string;
  content_type: ReportContentType;
  content_id: string;
  reason: ContentReport["reason"];
  description: string | null;
  status: ReportStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  action_taken: ReportAction | null;
  created_at: string;
  reporter?: { username: string | null; avatar_url: string | null } | null;
}

function transformRow(row: ReportRow): ContentReport {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    contentType: row.content_type,
    contentId: row.content_id,
    reason: row.reason,
    description: row.description,
    status: row.status,
    resolvedBy: row.resolved_by,
    resolvedAt: row.resolved_at,
    actionTaken: row.action_taken,
    createdAt: row.created_at,
    reporter: row.reporter
      ? { username: row.reporter.username, avatarUrl: row.reporter.avatar_url }
      : undefined,
  };
}

/**
 * Server-side service for content reports.
 * Reads/writes the content_reports table and applies moderation actions.
 */
export class ReportServerService {
  /** Count reports created today by a given reporter. */
  static async countTodayReports(reporterId: string): Promise<number> {
    const supabase = getSupabaseAdmin();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from("content_reports" as UntypedClient)
      .select("id", { count: "exact", head: true })
      .eq("reporter_id", reporterId)
      .gte("created_at", startOfDay.toISOString());

    if (error) {
      logger.error("Failed to count today's reports", { error: error.message, reporterId });
      return 0;
    }
    return count ?? 0;
  }

  /**
   * Create a report authored by the given reporter.
   * Returns a discriminated result to let the route map errors to HTTP codes.
   */
  static async createReport(
    reporterId: string,
    input: CreateReportInput
  ): Promise<
    { ok: true; report: ContentReport } | { ok: false; code: "limit" | "duplicate" | "error" }
  > {
    const todayCount = await ReportServerService.countTodayReports(reporterId);
    if (todayCount >= MAX_REPORTS_PER_DAY) {
      return { ok: false, code: "limit" };
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("content_reports" as UntypedClient)
      .insert({
        reporter_id: reporterId,
        content_type: input.contentType,
        content_id: input.contentId,
        reason: input.reason,
        description: input.description ?? null,
      })
      .select(
        "id, reporter_id, content_type, content_id, reason, description, status, resolved_by, resolved_at, action_taken, created_at"
      )
      .single();

    if (error || !data) {
      // Unique violation → the reporter already reported this content.
      if (error?.code === "23505") return { ok: false, code: "duplicate" };
      logger.error("Failed to create report", { error: error?.message, reporterId });
      return { ok: false, code: "error" };
    }

    return { ok: true, report: transformRow(data as ReportRow) };
  }

  /** List reports for the admin queue, optionally filtered by status. */
  static async listReports(status: ReportStatus | "all" = "pending"): Promise<ContentReport[]> {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("content_reports" as UntypedClient)
      .select(
        "id, reporter_id, content_type, content_id, reason, description, status, resolved_by, resolved_at, action_taken, created_at, reporter:profiles!reporter_id(username, avatar_url)"
      );

    if (status !== "all") query = query.eq("status", status);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      logger.error("Failed to list reports", { error: error.message });
      return [];
    }

    return withContentPreviews(((data ?? []) as ReportRow[]).map(transformRow));
  }

  /** Fetch a single report by id. */
  static async getReport(id: string): Promise<ContentReport | null> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("content_reports" as UntypedClient)
      .select(
        "id, reporter_id, content_type, content_id, reason, description, status, resolved_by, resolved_at, action_taken, created_at"
      )
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return transformRow(data as ReportRow);
  }

  /**
   * Review, resolve or dismiss a report.
   * Resolving applies the moderation action and closes every other open report
   * on the same content; dismissing only affects this report.
   * Returns "closed" when the report is no longer open.
   */
  static async updateReport(
    id: string,
    status: ReportStatus,
    action: ReportAction,
    adminId: string,
    options: ModerationOptions = {}
  ): Promise<"ok" | "not_found" | "closed" | "error"> {
    const report = await ReportServerService.getReport(id);
    if (!report) return "not_found";
    if (!OPEN_STATUSES.includes(report.status)) return "closed";

    if (status === "resolved" && action !== "none") {
      const applied = await applyModerationAction(
        action,
        report.contentType,
        report.contentId,
        adminId,
        options
      );
      if (!applied) return "error";
    }

    const updates: Record<string, unknown> = { status };
    if (status === "resolved" || status === "dismissed") {
      updates.resolved_by = adminId;
      updates.resolved_at = new Date().toISOString();
      updates.action_taken = status === "resolved" ? action : "none";
    }

    const table = getSupabaseAdmin()
      .from("content_reports" as UntypedClient)
      .update(updates);
    const query =
      status === "resolved"
        ? table
            .eq("content_type", report.contentType)
            .eq("content_id", report.contentId)
            .in("status", OPEN_STATUSES)
        : table.eq("id", id);

    const { error } = await query;
    if (error) {
      logger.error("Failed to update report", { error: error.message, id });
      return "error";
    }
    return "ok";
  }
}
