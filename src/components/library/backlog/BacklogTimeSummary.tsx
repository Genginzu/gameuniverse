"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { formatPlayTime } from "@/lib/utils/formatPlayTime";
import type { BacklogTimeSummary as TimeSummary } from "@/types/backlog";

interface BacklogTimeSummaryProps {
  summary: TimeSummary;
  locale: string;
}

/** Compact summary of total remaining playtime across the backlog. */
export function BacklogTimeSummary({ summary, locale }: BacklogTimeSummaryProps) {
  const t = useTranslations("userLibrary.backlog");

  return (
    <div className="border-editorial-line bg-editorial-2 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border p-5">
      <Metric
        icon="lucide:library"
        value={String(summary.gameCount)}
        label={t("summary.games")}
      />
      <Metric
        icon="lucide:hourglass"
        value={t("hoursValue", { hours: formatPlayTime(summary.totalEstimatedHours, locale) })}
        label={t("summary.totalTime")}
        accent
      />
      {summary.gamesWithoutEstimate > 0 && (
        <p className="text-editorial-muted text-xs">
          {t("summary.withoutEstimate", { count: summary.gamesWithoutEstimate })}
        </p>
      )}
    </div>
  );
}

function Metric({
  icon,
  value,
  label,
  accent,
}: {
  icon: string;
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`grid size-10 place-items-center rounded-xl ${
          accent ? "bg-editorial-accent/15 text-editorial-accent" : "bg-editorial-3 text-white"
        }`}
      >
        <Icon icon={icon} className="h-5 w-5" />
      </span>
      <span>
        <span className="block font-display text-xl font-bold leading-none text-white">
          {value}
        </span>
        <span className="text-editorial-muted mt-1 block text-xs uppercase tracking-wide">
          {label}
        </span>
      </span>
    </div>
  );
}
