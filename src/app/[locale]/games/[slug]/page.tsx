import { notFound } from "next/navigation";
import { GameDetailsContent } from "@/components/games/GameDetailsContent";
import { GameService } from "@/lib/services/gameService";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

interface GameDetailsPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export default async function GameDetailsPage({ params }: GameDetailsPageProps) {
  const { locale, slug } = await params;

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
              title={locale === "fr" ? "Erreur de chargement" : "Loading Error"}
              description={
                locale === "fr"
                  ? "Une erreur s'est produite lors de l'affichage des détails du jeu."
                  : "An error occurred while displaying game details."
              }
              showBackButton={true}
              backUrl={`/${locale}/games`}
              backLabel={locale === "fr" ? "Retour aux jeux" : "Back to games"}
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
          title={locale === "fr" ? "Erreur de chargement" : "Loading Error"}
          description={
            locale === "fr"
              ? "Impossible de charger les détails du jeu."
              : "Unable to load game details."
          }
          showBackButton={true}
          backUrl={`/${locale}/games`}
          backLabel={locale === "fr" ? "Retour aux jeux" : "Back to games"}
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
