"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { Icon } from "@iconify/react";
import { ReportService } from "@/lib/services/reportService";
import { AdminReportCard } from "./AdminReportCard";
import type { ModerationHandler } from "./AdminReportActions";
import type { ReportsResponse } from "@/types/report";

const FILTERS = ["pending", "reviewed", "resolved", "dismissed", "all"] as const;

const PANEL =
  "flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-slate-800";

export function AdminReportsContent() {
  const t = useTranslations("admin.reports");
  const [filter, setFilter] = useState<string>("pending");
  const { data, error, isLoading, mutate } = useSWR<ReportsResponse>(
    `/api/admin/reports?status=${filter}`,
    fetcher
  );

  const handleModerate: ModerationHandler = async (id, decision, action = "none", options) => {
    try {
      await ReportService.resolveReport(id, decision, action, options);
    } finally {
      // Refresh in every case: a failure may mean the report changed meanwhile.
      await mutate();
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">{t("title")}</h1>

      <div className="flex flex-wrap gap-2" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`min-h-[44px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === f
                ? "from-palette-secondary-500 to-palette-primary-500 bg-linear-to-r text-white shadow-sm"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
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
      ) : error ? (
        <div className={PANEL}>
          <Icon icon="lucide:alert-triangle" className="mb-3 size-10 text-red-600" />
          <p className="text-sm text-gray-700 dark:text-gray-200">{t("loadError")}</p>
        </div>
      ) : data?.reports.length === 0 ? (
        <div className={PANEL}>
          <Icon icon="lucide:check-circle" className="mb-3 size-10 text-green-600" />
          <p className="text-sm text-gray-700 dark:text-gray-200">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.reports.map((r) => (
            <AdminReportCard key={r.id} report={r} onModerate={handleModerate} />
          ))}
        </div>
      )}
    </div>
  );
}
