import { notFound } from "next/navigation";
import { PlayerService } from "@/lib/services/playerService";
import { PlayerStatsService } from "@/lib/services/playerStatsService";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { YearInReviewContent } from "@/components/players/YearInReviewContent";
import { getTranslations } from "next-intl/server";

interface YearInReviewPageProps {
  params: Promise<{
    locale: string;
    id: string;
    year: string;
  }>;
}

export default async function YearInReviewPage({ params }: YearInReviewPageProps) {
  const { locale, id, year: yearStr } = await params;
  const t = await getTranslations({ locale, namespace: "players.yearInReview" });

  // Validate player ID format — Requirements 6.3
  if (!PlayerService.validatePlayerId(id)) {
    notFound();
  }

  // Validate year is a valid number in a reasonable range
  const year = parseInt(yearStr, 10);
  if (isNaN(year) || year < 2000 || year > new Date().getFullYear()) {
    notFound();
  }

  try {
    const yearReview = await PlayerStatsService.fetchYearInReview(id, year, locale);

    // Player not found or stats private — Requirements 6.3
    if (!yearReview) {
      notFound();
    }

    // Year has no data — Requirements 6.4
    const hasData = yearReview.gamesAdded > 0 || yearReview.totalPlayTime > 0;

    return (
      <DashboardLayout>
        <YearInReviewContent
          yearReview={yearReview}
          playerId={id}
          locale={locale}
          noData={!hasData}
          noDataMessage={t("noData")}
          noDataDescription={t("noDataDescription")}
        />
      </DashboardLayout>
    );
  } catch {
    notFound();
  }
}
