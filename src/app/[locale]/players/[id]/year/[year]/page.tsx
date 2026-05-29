import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PlayerService } from "@/lib/services/playerService";
import { PlayerStatsService } from "@/lib/services/playerStatsService";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { DynamicAccent } from "@/components/shared/DynamicAccent";
import { paletteFromHex } from "@/lib/utils/accent-palette";
import { YearInReviewContent } from "@/components/players/year-in-review/YearInReviewContent";

interface YearInReviewPageProps {
  params: Promise<{
    locale: string;
    id: string;
    year: string;
  }>;
}

export async function generateMetadata({ params }: YearInReviewPageProps): Promise<Metadata> {
  const { locale, id, year } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.yearInReview" });

  let playerName = id;
  try {
    const player = await PlayerService.fetchPlayerDetailsFromDB(id, locale);
    if (player?.fullName) playerName = player.fullName;
  } catch {
    // fallback to id
  }

  return {
    title: t("title", { year, player: playerName }),
    description: t("description", { year, player: playerName }),
    alternates: {
      languages: {
        fr: `/fr/players/${id}/year/${year}`,
        en: `/en/players/${id}/year/${year}`,
      },
    },
  };
}

export default async function YearInReviewPage({ params }: YearInReviewPageProps) {
  const { locale, id, year: yearStr } = await params;
  const t = await getTranslations({ locale, namespace: "players.yearInReview" });

  if (!PlayerService.validatePlayerId(id)) {
    notFound();
  }

  const year = parseInt(yearStr, 10);
  if (isNaN(year) || year < 2000 || year > new Date().getFullYear()) {
    notFound();
  }

  try {
    const yearReview = await PlayerStatsService.fetchYearInReview(id, year, locale);

    if (!yearReview) {
      notFound();
    }

    const hasData = yearReview.gamesAdded > 0 || yearReview.totalPlayTime > 0;

    return (
      <EditorialShell>
        <DynamicAccent palette={paletteFromHex("#0077e6", "blue")} as="div">
          <YearInReviewContent
            yearReview={yearReview}
            playerId={id}
            locale={locale}
            noData={!hasData}
            noDataMessage={t("noData")}
            noDataDescription={t("noDataDescription")}
          />
        </DynamicAccent>
      </EditorialShell>
    );
  } catch {
    notFound();
  }
}
