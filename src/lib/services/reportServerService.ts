import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import { NotificationServerService } from "@/lib/services/notificationServerService";
import {
  MAX_REPORTS_PER_DAY,
  type ContentReport,
  type CreateReportInput,
  type ReportAction,
  type ReportContentType,
  type ReportStatus,
} from "@/types/report";

// content_reports is not present in the generated Supabase types yet
// (migration applied but types not regenerated), mirroring the disputes/
// notifications approach.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedClient = any;

/** Maps a content type to its table and author column for moderation actions. */
const CONTENT_TABLE_MAP: Record<
  ReportContentType,
  { table: string; authorColumn: string; deletable: boolean }
> = {
  review: { table: "game_reviews", authorColumn: "user_id", deletable: true },
  post: { table: "player_posts", authorColumn: "player_id", deletable: true },
  comment: { table: "post_comments", authorColumn: "player_id", deletable: true },
  profile: { table: "profiles", authorColumn: "id", deletable: false },
};

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
    | { ok: true; report: ContentReport }
    | { ok: false; code: "limit" | "duplicate" | "error" }
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

    return ((data ?? []) as ReportRow[]).map(transformRow);
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
   * Apply a moderation side effect to the reported content.
   * Returns true on success (or when nothing needs to be done).
   */
  static async applyAction(
    action: ReportAction,
    contentType: ReportContentType,
    contentId: string,
    adminId: string
  ): Promise<boolean> {
    if (action === "none") return true;

    const supabase = getSupabaseAdmin();
    const mapping = CONTENT_TABLE_MAP[contentType];

    if (action === "content_deleted") {
      if (!mapping.deletable) return false;
      const { error } = await supabase.from(mapping.table).delete().eq("id", contentId);
      if (error) {
        logger.error("Failed to delete reported content", {
          error: error.message,
          contentType,
          contentId,
        });
        return false;
      }
      return true;
    }

    // Both warn and suspend need the content author's id.
    const authorId = await ReportServerService.resolveAuthorId(contentType, contentId);
    if (!authorId) return false;

    if (action === "author_warned") {
      await NotificationServerService.create(
        authorId,
        adminId,
        "moderation_warning",
        contentId,
        ""
      );
      return true;
    }

    if (action === "author_suspended") {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_suspended: true,
          suspended_at: new Date().toISOString(),
          suspended_reason: "content_report",
        })
        .eq("id", authorId);
      if (error) {
        logger.error("Failed to suspend author", { error: error.message, authorId });
        return false;
      }
      return true;
    }

    return false;
  }

  /** Resolve the author id of a reported piece of content. */
  private static async resolveAuthorId(
    contentType: ReportContentType,
    contentId: string
  ): Promise<string | null> {
    const mapping = CONTENT_TABLE_MAP[contentType];
    if (contentType === "profile") return contentId;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(mapping.table)
      .select(mapping.authorColumn)
      .eq("id", contentId)
      .single();

    if (error || !data) {
      logger.error("Failed to resolve content author", {
        error: error?.message,
        contentType,
        contentId,
      });
      return null;
    }
    return (data as unknown as Record<string, string>)[mapping.authorColumn] ?? null;
  }

  /**
   * Resolve, review or dismiss a report and apply the chosen action.
   * `status` is the new status; `action` is the moderation action taken.
   */
  static async updateReport(
    id: string,
    status: ReportStatus,
    action: ReportAction,
    adminId: string
  ): Promise<boolean> {
    const report = await ReportServerService.getReport(id);
    if (!report) return false;

    if (status === "resolved" && action !== "none") {
      const applied = await ReportServerService.applyAction(
        action,
        report.contentType,
        report.contentId,
        adminId
      );
      if (!applied) return false;
    }

    const supabase = getSupabaseAdmin();
    const updates: Record<string, unknown> = { status };

    if (status === "resolved" || status === "dismissed") {
      updates.resolved_by = adminId;
      updates.resolved_at = new Date().toISOString();
      updates.action_taken = status === "resolved" ? action : "none";
    }

    const { error } = await supabase
      .from("content_reports" as UntypedClient)
      .update(updates)
      .eq("id", id);

    if (error) {
      logger.error("Failed to update report", { error: error.message, id });
      return false;
    }
    return true;
  }
}
