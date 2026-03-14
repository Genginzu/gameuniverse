"use client";

import { useTranslations } from "next-intl";
import type { ReviewAnalyticsData } from "@/types/dashboard-stats";
import { formatLocalizedNumber } from "@/lib/utils/statsFormatters";

interface Props {
  analytics: ReviewAnalyticsData;
  locale: string;
}

interface GaugeConfig {
  id: string;
  value: number;
  displayValue: string;
  max: number;
  label: string;
}

/** Mini arc SVG de progression — id unique pour éviter les conflits de gradient */
function RadialGauge({ id, value, max, displayValue, label }: GaugeConfig) {
  const radius = 36;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const progress = max > 0 ? Math.min(value / max, 1) : 0;
  const dashOffset = circumference * (1 - progress);
  const gradientId = `radialGrad-${id}`;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-20 w-20">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 84 84">
          <circle
            cx="42"
            cy="42"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-gray-200 dark:text-slate-700"
          />
          <circle
            cx="42"
            cy="42"
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-700"
          />
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(139, 92, 246)" />
              <stop offset="100%" stopColor="rgb(6, 182, 212)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-900 dark:text-white">{displayValue}</span>
        </div>
      </div>
      <span className="text-xs text-gray-500 dark:text-slate-400">{label}</span>
    </div>
  );
}

/**
 * Variante 5 — Grille radiale complète
 * Toutes les stats avis en arcs SVG : Moyenne, Médiane, Mode (sur 20),
 * Total avis et Votes utiles (échelle dynamique).
 */
export function ReviewMetricsRadial({ analytics, locale }: Props) {
  const t = useTranslations("playerStats");

  const fmt = (v: number | null | undefined) =>
    v != null ? formatLocalizedNumber(Math.round(v * 10) / 10, locale) : "—";

  /* Max dynamique pour Total avis : arrondi à la dizaine supérieure, min 10 */
  const totalMax = Math.max(10, Math.ceil(analytics.totalReviews / 10) * 10);
  /* Max pour Votes utiles : au moins le total d'avis, min 1 */
  const helpfulMax = Math.max(analytics.totalReviews, 1);

  const gauges: GaugeConfig[] = [
    {
      id: "avg",
      value: analytics.averageRating ?? 0,
      displayValue: fmt(analytics.averageRating),
      max: 20,
      label: t("reviewAnalytics.average"),
    },
    {
      id: "med",
      value: analytics.medianRating ?? 0,
      displayValue: fmt(analytics.medianRating),
      max: 20,
      label: t("reviewAnalytics.median"),
    },
    {
      id: "mode",
      value: analytics.modeRating ?? 0,
      displayValue: fmt(analytics.modeRating),
      max: 20,
      label: t("reviewAnalytics.mode"),
    },
    {
      id: "maxRating",
      value: analytics.maxRating ?? 0,
      displayValue: fmt(analytics.maxRating),
      max: 20,
      label: t("reviewAnalytics.maxRating"),
    },
    {
      id: "total",
      value: analytics.totalReviews,
      displayValue: formatLocalizedNumber(analytics.totalReviews, locale),
      max: totalMax,
      label: t("reviewAnalytics.totalReviews"),
    },
    {
      id: "helpful",
      value: analytics.helpfulVotesReceived,
      displayValue: formatLocalizedNumber(analytics.helpfulVotesReceived, locale),
      max: helpfulMax,
      label: t("reviewAnalytics.helpfulVotes"),
    },
  ];

  return (
    <div className="grid grid-cols-2 place-items-center gap-4 sm:grid-cols-3 lg:grid-cols-2">
      {gauges.map((g) => (
        <RadialGauge key={g.id} {...g} />
      ))}
    </div>
  );
}
