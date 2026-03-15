import { notFound } from "next/navigation";
import { AchievementsPageContent } from "@/components/achievements/AchievementsPageContent";
import { PlayerService } from "@/lib/services/playerService";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { getTranslations } from "next-intl/server";

interface AchievementsPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function AchievementsPage({ params }: AchievementsPageProps) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "achievements" });

  if (!PlayerService.validatePlayerId(id)) {
    notFound();
  }

  return (
    <ErrorBoundary
      fallback={
        <ErrorFallback
          title={t("error")}
          description={t("error")}
          showRefresh
          showBackButton
          backUrl={`/${locale}/players/${id}`}
          backLabel={t("backToPlayer")}
          locale={locale}
        />
      }
    >
      <AchievementsPageContent playerId={id} />
    </ErrorBoundary>
  );
}

export async function generateMetadata({ params }: AchievementsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "achievements" });

  return {
    title: `${t("pageTitle")} | Game Universe`,
  };
}
