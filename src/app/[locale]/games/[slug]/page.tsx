import { notFound } from "next/navigation";
import { GameDetailsContent } from "@/components/games/GameDetailsContent";
import { GameService } from "@/lib/services/gameService";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { getTranslations } from "next-intl/server";

interface GameDetailsPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export default async function GameDetailsPage({ params }: GameDetailsPageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "gameDetails.errors" });

  try {
    const game = await GameService.fetchGameDetails(slug, locale);

    if (!game) {
      notFound();
    }

    return (
      <DashboardLayout>
        <ErrorBoundary
          fallback={
            <ErrorFallback
              title={t("loadingTitle")}
              description={t("loadingDescription")}
              showBackButton={true}
              backUrl={`/${locale}/games`}
              backLabel={t("backToGames")}
              locale={locale}
            />
          }
        >
          <GameDetailsContent game={game} locale={locale} />
        </ErrorBoundary>
      </DashboardLayout>
    );
  } catch (error) {
    console.error("Error in GameDetailsPage:", error);
    // Return error state
    return (
      <DashboardLayout>
        <ErrorFallback
          title={t("loadingTitle")}
          description={t("unableToLoad")}
          showBackButton={true}
          backUrl={`/${locale}/games`}
          backLabel={t("backToGames")}
          locale={locale}
        />
      </DashboardLayout>
    );
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: GameDetailsPageProps) {
  const { locale, slug } = await params;

  return await GameService.generateGameMetadata(slug, locale);
}
