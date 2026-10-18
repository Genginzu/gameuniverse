import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import type { MyReport, ReportContentType, ReportStatus } from "@/types/report";

// content_reports is not present in the generated Supabase types yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedClient = any;

const CANCELLABLE_STATUSES: ReportStatus[] = ["pending", "reviewed"];

interface MyReportRow {
  id: string;
  content_type: ReportContentType;
  content_id: string;
  status: ReportStatus;
}

/** Server-side operations a reporter performs on their own reports. */
export class ReportUserServerService {
  /** List every report created by the given user. */
  static async listMine(reporterId: string): Promise<MyReport[]> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("content_reports" as UntypedClient)
      .select("id, content_type, content_id, status")
      .eq("reporter_id", reporterId);

    if (error) {
      logger.error("Failed to list user reports", { error: error.message, reporterId });
      return [];
    }

    return ((data ?? []) as MyReportRow[]).map((row) => ({
      id: row.id,
      contentType: row.content_type,
      contentId: row.content_id,
      status: row.status,
      cancellable: CANCELLABLE_STATUSES.includes(row.status),
    }));
  }

  /**
   * Cancel (delete) a report owned by the reporter, only while it is still open.
   * Returns "not_found" when the report does not exist or belongs to someone else.
   */
  static async cancel(
    id: string,
    reporterId: string
  ): Promise<"ok" | "not_found" | "closed" | "error"> {
    const supabase = getSupabaseAdmin();
    const { data: report, error: fetchError } = await supabase
      .from("content_reports" as UntypedClient)
      .select("id, status")
      .eq("id", id)
      .eq("reporter_id", reporterId)
      .maybeSingle();

    if (fetchError) {
      logger.error("Failed to fetch report for cancel", { error: fetchError.message, id });
      return "error";
    }
    if (!report) return "not_found";
    if (!CANCELLABLE_STATUSES.includes((report as MyReportRow).status)) return "closed";

    const { error } = await supabase
      .from("content_reports" as UntypedClient)
      .delete()
      .eq("id", id)
      .eq("reporter_id", reporterId);

    if (error) {
      logger.error("Failed to cancel report", { error: error.message, id });
      return "error";
    }
    return "ok";
  }
}
