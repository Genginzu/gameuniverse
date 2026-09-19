import type {
  ContentReport,
  CreateReportInput,
  ReportAction,
  ReportDecision,
} from "@/types/report";

/**
 * Client service for the content reporting system.
 * Wraps the /api/reports and /api/admin/reports endpoints.
 */
export class ReportService {
  /**
   * Submit a report for a piece of content.
   * @throws Error with a machine-readable code ("limit" | "duplicate") when known.
   */
  static async createReport(input: CreateReportInput): Promise<ContentReport> {
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const error = new Error(data.error || "Failed to submit report");
      if (data.code) (error as Error & { code?: string }).code = data.code;
      throw error;
    }

    const data = await response.json();
    return data.report;
  }

  /** Admin: resolve, review or dismiss a report. */
  static async resolveReport(
    id: string,
    decision: ReportDecision,
    actionTaken: ReportAction = "none"
  ): Promise<void> {
    const response = await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, actionTaken }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to update report");
    }
  }
}
