"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { Icon } from "@iconify/react";
import { ReportService } from "@/lib/services/reportService";
import type { ContentReport, ReportAction, ReportsResponse } from "@/types/report";

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-500",
  reviewed: "text-blue-500",
  resolved: "text-green-500",
  dismissed: "text-gray-400",
};

const FILTERS = ["pending", "reviewed", "resolved", "dismissed", "all"] as const;

const CONTENT_ICONS: Record<string, string> = {
  review: "lucide:star",
  post: "lucide:file-text",
  comment: "lucide:message-circle",
  profile: "lucide:user",
};

/** Actions available when resolving a report, keyed by content type. */
function actionsFor(contentType: string): ReportAction[] {
  const base: ReportAction[] = ["author_warned", "author_suspended"];
  // Profiles cannot be deleted, only their author warned/suspended.
  return contentType === "profile" ? base : ["content_deleted", ...base];
}

export function AdminReportsContent() {
  const t = useTranslations("admin.reports");
  const [filter, setFilter] = useState<string>("pending");
  const { data, isLoading, mutate } = useSWR<ReportsResponse>(
    `/api/admin/reports?status=${filter}`,
    fetcher
  );

  const handleResolve = async (id: string, action: ReportAction) => {
    await ReportService.resolveReport(id, "resolve", action);
    await mutate();
  };

  const handleSimple = async (id: string, decision: "review" | "dismiss") => {
    await ReportService.resolveReport(id, decision);
    await mutate();
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">{t("title")}</h1>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`min-h-[44px] rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              filter === f
                ? "from-palette-secondary-500 to-palette-primary-500 bg-linear-to-r text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            {t(`filter.${f}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      ) : data?.reports.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-xl p-8 text-center">
          <Icon icon="lucide:check-circle" className="mb-3 size-10 text-green-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.reports.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              onResolve={handleResolve}
              onSimple={handleSimple}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ReportCardProps {
  report: ContentReport;
  onResolve: (id: string, action: ReportAction) => void;
  onSimple: (id: string, decision: "review" | "dismiss") => void;
}

function ReportCard({ report: r, onResolve, onSimple }: ReportCardProps) {
  const t = useTranslations("admin.reports");
  const isOpen = r.status === "pending" || r.status === "reviewed";

  return (
    <div className="glass-card space-y-3 rounded-xl p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Icon icon={CONTENT_ICONS[r.contentType]} className="size-4 text-gray-400" />
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          {t(`contentType.${r.contentType}`)}
        </span>
        <span className={`text-xs font-medium ${STATUS_COLORS[r.status]}`}>
          {t(`status.${r.status}`)}
        </span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          {t(`reason.${r.reason}`)}
        </span>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300">
        {t("reportedBy")}: <span className="font-medium">{r.reporter?.username ?? "?"}</span>
      </p>
      <p className="text-xs break-all text-gray-400">
        {t("contentId")}: {r.contentId}
      </p>
      {r.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{r.description}</p>
      )}
      <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>

      {r.actionTaken && r.actionTaken !== "none" && (
        <p className="text-palette-secondary-400 text-xs font-medium">
          {t("actionTaken")}: {t(`action.${r.actionTaken}`)}
        </p>
      )}

      {isOpen && (
        <div className="flex flex-wrap gap-1.5 border-t border-gray-100 pt-3 dark:border-gray-700">
          {r.status === "pending" && (
            <button
              onClick={() => onSimple(r.id, "review")}
              className="min-h-[44px] rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-500 hover:bg-blue-500/20"
            >
              {t("actions.review")}
            </button>
          )}
          {actionsFor(r.contentType).map((action) => (
            <button
              key={action}
              onClick={() => onResolve(r.id, action)}
              className="min-h-[44px] rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-500 hover:bg-green-500/20"
            >
              {t(`action.${action}`)}
            </button>
          ))}
          <button
            onClick={() => onSimple(r.id, "dismiss")}
            className="min-h-[44px] rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-200 dark:bg-gray-800"
          >
            {t("actions.dismiss")}
          </button>
        </div>
      )}
    </div>
  );
}
