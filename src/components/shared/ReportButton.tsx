"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { useMyReports } from "@/hooks/useMyReports";
import { ReportService } from "@/lib/services/reportService";
import { ReportModal } from "./ReportModal";
import { CancelReportDialog } from "./CancelReportDialog";
import type { MyReportsResponse, ReportContentType } from "@/types/report";

interface ReportButtonProps {
  contentType: ReportContentType;
  contentId: string;
  /** Extra classes for the trigger button. */
  className?: string;
  /** Show the label next to the flag icon. */
  showLabel?: boolean;
}

/**
 * Flag button: opens the report modal, or — once the user already reported
 * the content — shows a filled red flag that withdraws the report on click.
 */
export function ReportButton({
  contentType,
  contentId,
  className,
  showLabel = false,
}: ReportButtonProps) {
  const t = useTranslations("reports");
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { findReport, mutate } = useMyReports();

  const report = findReport(contentType, contentId);
  const isReported = !!report;
  const canCancel = !!report?.cancellable;

  const handleCancel = async () => {
    if (!report) return;
    try {
      await ReportService.cancelReport(report.id);
    } catch (err) {
      // State may have changed server-side (e.g. handled by an admin): resync.
      await mutate();
      throw err;
    }
    await mutate(
      (current?: MyReportsResponse) => ({
        reports: (current?.reports ?? []).filter((r) => r.id !== report.id),
      }),
      { revalidate: false }
    );
  };

  const label = !isReported ? t("report") : canCancel ? t("cancelReport") : t("reportHandled");

  return (
    <>
      <button
        type="button"
        onClick={isReported ? () => setConfirmOpen(true) : () => setOpen(true)}
        disabled={isReported && !canCancel}
        aria-label={label}
        aria-pressed={isReported}
        title={label}
        className={cn(
          "group inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full text-sm transition-colors disabled:cursor-default",
          showLabel ? "px-3" : "size-11",
          isReported
            ? "bg-red-500/15 text-red-500 hover:bg-red-500/25"
            : "text-gray-400 hover:bg-red-500/10 hover:text-red-500 dark:hover:bg-red-500/15",
          className
        )}
      >
        {isReported && canCancel ? (
          <>
            <Icon icon="mdi:flag" className="size-4 group-hover:hidden" />
            <Icon icon="lucide:flag-off" className="hidden size-4 group-hover:block" />
          </>
        ) : (
          <Icon icon={isReported ? "mdi:flag" : "lucide:flag"} className="size-4" />
        )}
        {showLabel && <span>{isReported ? t("reported") : t("report")}</span>}
      </button>
      {open && (
        <ReportModal
          contentType={contentType}
          contentId={contentId}
          onClose={() => setOpen(false)}
          onReported={() => mutate()}
        />
      )}
      {confirmOpen && (
        <CancelReportDialog onClose={() => setConfirmOpen(false)} onConfirm={handleCancel} />
      )}
    </>
  );
}
