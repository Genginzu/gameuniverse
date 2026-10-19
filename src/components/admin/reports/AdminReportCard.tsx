"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { AdminReportContentPreview } from "./AdminReportContentPreview";
import { AdminReportActions, type ModerationHandler } from "./AdminReportActions";
import type { ContentReport } from "@/types/report";

/** Status pills: dark text on light tint (≥4.5:1) in light mode, light text on tint in dark mode. */
const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  reviewed:
    "bg-palette-primary-100 text-palette-primary-800 dark:bg-palette-primary-500/15 dark:text-palette-primary-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  dismissed: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
};

const CONTENT_ICONS: Record<string, string> = {
  review: "lucide:star",
  post: "lucide:file-text",
  comment: "lucide:message-circle",
  profile: "lucide:user",
};

const BADGE =
  "rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200";

interface AdminReportCardProps {
  report: ContentReport;
  onModerate: ModerationHandler;
}

export function AdminReportCard({ report: r, onModerate }: AdminReportCardProps) {
  const t = useTranslations("admin.reports");
  const isOpen = r.status === "pending" || r.status === "reviewed";

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-center gap-2">
        <Icon
          icon={CONTENT_ICONS[r.contentType]}
          className="size-4 text-gray-600 dark:text-gray-300"
          aria-hidden
        />
        <span className={BADGE}>{t(`contentType.${r.contentType}`)}</span>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
            STATUS_STYLES[r.status]
          )}
        >
          {t(`status.${r.status}`)}
        </span>
        <span className={BADGE}>{t(`reason.${r.reason}`)}</span>
      </div>

      <AdminReportContentPreview preview={r.content} />

      <p className="text-sm text-gray-700 dark:text-gray-200">
        {t("reportedBy")}:{" "}
        <span className="font-semibold text-gray-900 dark:text-white">
          {r.reporter?.username ?? "?"}
        </span>
        <span className="text-gray-600 dark:text-gray-300">
          {" · "}
          {new Date(r.createdAt).toLocaleString()}
        </span>
      </p>
      {r.description && (
        <p className="rounded-lg border-l-4 border-gray-300 bg-gray-50 p-2 text-sm text-gray-800 italic dark:border-gray-600 dark:bg-slate-900/60 dark:text-gray-100">
          {r.description}
        </p>
      )}

      {r.actionTaken && r.actionTaken !== "none" && (
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
          {t("actionTaken")}: {t(`action.${r.actionTaken}`)}
        </p>
      )}

      {isOpen && <AdminReportActions report={r} onModerate={onModerate} />}
    </div>
  );
}
