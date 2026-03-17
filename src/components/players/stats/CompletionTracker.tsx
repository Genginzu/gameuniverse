"use client";

import { useTranslations } from "next-intl";
import { CheckCircle } from "lucide-react";
import type { CompletionStats } from "@/types/dashboard-stats";
import { StatsEmptyState } from "@/components/players/stats/StatsEmptyState";
import { StatsSectionTitle } from "@/components/players/stats/StatsSectionTitle";

interface CompletionTrackerProps {
  completion: CompletionStats;
}

const STATUS_COLORS = {
  completed: { bar: "bg-green-500", dot: "bg-green-500" },
  playing: { bar: "bg-blue-500", dot: "bg-blue-500" },
  owned: { bar: "bg-gray-400 dark:bg-gray-500", dot: "bg-gray-400 dark:bg-gray-500" },
  wishlist: { bar: "bg-orange-500", dot: "bg-orange-500" },
} as const;

type StatusKey = keyof typeof STATUS_COLORS;

const STATUS_ORDER: StatusKey[] = ["completed", "playing", "owned", "wishlist"];

export function CompletionTracker({ completion }: CompletionTrackerProps) {
  const t = useTranslations("playerStats");

  if (completion.total === 0) {
    return (
      <div>
        <StatsSectionTitle>{t("completion.title")}</StatsSectionTitle>
        <StatsEmptyState
          icon={<CheckCircle className="h-8 w-8" />}
          message={t("completion.empty")}
        />
      </div>
    );
  }

  return (
    <div>
      <StatsSectionTitle>{t("completion.title")}</StatsSectionTitle>
      <div className="glass-card rounded-xl p-6 transition-all duration-300">
        {/* Percentage label */}
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {completion.completionPercentage}%
          </span>
          <span className="text-sm text-gray-500 dark:text-slate-400">
            {t("completion.percentage")}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-5 flex h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
          {STATUS_ORDER.map((status) => {
            const count = completion[status];
            if (count === 0) return null;
            const widthPercent = (count / completion.total) * 100;
            return (
              <div
                key={status}
                className={`${STATUS_COLORS[status].bar} transition-all duration-300`}
                style={{ width: `${widthPercent}%` }}
              />
            );
          })}
        </div>

        {/* Counters per status */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATUS_ORDER.map((status) => (
            <div key={status} className="flex items-center gap-2">
              <span className={`inline-block h-3 w-3 rounded-full ${STATUS_COLORS[status].dot}`} />
              <div className="min-w-0">
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {t(`completion.${status}`)}
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {completion[status]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
