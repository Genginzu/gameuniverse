import { notFound } from "next/navigation";
import { PlayerDetailsContent } from "@/components/players/PlayerDetailsContent";
import { PlayerService } from "@/lib/services/playerService";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { getTranslations } from "next-intl/server";

interface PlayerDetailsPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function PlayerDetailsPage({ params }: PlayerDetailsPageProps) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "players.errors" });

  // Validate player ID format - Requirements 5.3
  if (!PlayerService.validatePlayerId(id)) {
    notFound();
  }

  try {
    const player = await PlayerService.fetchPlayerDetailsFromDB(id, locale);

    // Handle 404 if player not found - Requirements 5.3
    if (!player) {
      notFound();
    }

    return (
      <DashboardLayout>
        <ErrorBoundary
          fallback={
            <ErrorFallback
              title={t("loadingTitle")}
              description={t("detailsLoadingDescription")}
              showBackButton={true}
              backUrl={`/${locale}/players`}
              backLabel={t("backToPlayers")}
              locale={locale}
            />
          }
        >
          <PlayerDetailsContent player={player} locale={locale} />
        </ErrorBoundary>
      </DashboardLayout>
    );
  } catch (error) {
    console.error("Error in PlayerDetailsPage:", error);
    // Return error state - Requirements 9.1, 9.2
    return (
      <DashboardLayout>
        <ErrorFallback
          title={t("loadingTitle")}
          description={t("unableToLoad")}
          showBackButton={true}
          backUrl={`/${locale}/players`}
          backLabel={t("backToPlayers")}
          locale={locale}
        />
      </DashboardLayout>
    );
  }
}

// Generate metadata for SEO - Requirements 5.4
export async function generateMetadata({ params }: PlayerDetailsPageProps) {
  const { locale, id } = await params;

  return await PlayerService.generatePlayerMetadata(id, locale);
}
