"use client";

import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
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
      href={`/${locale}/players/${playerId}`}
      className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      {t("backToProfile")}
    </Link>
  );

  // No-data state — Req 6.4
  if (noData) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        {backLink}
        <h1 className="mt-6 text-3xl font-bold text-white">
          {t("title", { year: yearReview.year })}
        </h1>
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <p className="text-lg font-semibold text-muted-foreground">{noDataMessage}</p>
          <p className="mt-2 text-sm text-muted-foreground">{noDataDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {backLink}
      <h1 className="mb-8 mt-6 text-3xl font-bold text-white">
        {t("title", { year: yearReview.year })}
      </h1>
      <YearInReviewCards yearReview={yearReview} locale={locale} t={t} />
    </div>
  );
}
