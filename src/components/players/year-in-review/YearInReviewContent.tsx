"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import type { YearInReview } from "@/types/player-stats";
import { YearInReviewCards } from "./YearInReviewCards";

interface YearInReviewContentProps {
  yearReview: YearInReview;
  playerId: string;
  locale: string;
  noData: boolean;
  noDataMessage: string;
  noDataDescription: string;
}

/**
 * Full year-in-review page content — Req 6.1, 6.2, 6.4, 6.5.
 * Displays annual stats in colorful visual cards, or a no-data message.
 */
export function YearInReviewContent({
  yearReview,
  playerId,
  locale,
  noData,
  noDataMessage,
  noDataDescription,
}: YearInReviewContentProps) {
  const t = useTranslations("players.yearInReview");

  const backLink = (
    <Link
      href={`/players/${playerId}`}
      className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white"
    >
      <Icon icon="lucide:arrow-left" className="h-4 w-4" />
      {t("backToProfile")}
    </Link>
  );

  // No-data state — Req 6.4
  if (noData) {
    return (
      <div className="min-h-screen bg-[var(--editorial-bg)]">
        <div className="mx-auto max-w-4xl px-4 py-8">
          {backLink}
          <h1 className="editorial-display mt-6 text-3xl font-bold text-white">
            {t("title", { year: yearReview.year })}
          </h1>
          <div className="mt-12 flex flex-col items-center justify-center text-center">
            <p className="text-lg font-semibold text-[var(--editorial-muted)]">{noDataMessage}</p>
            <p className="mt-2 text-sm text-[var(--editorial-muted)]">{noDataDescription}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--editorial-bg)]">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {backLink}
        <h1 className="editorial-display mt-6 mb-8 text-3xl font-bold text-white">
          {t("title", { year: yearReview.year })}
        </h1>
        <YearInReviewCards yearReview={yearReview} locale={locale} t={t} />
      </div>
    </div>
  );
}
