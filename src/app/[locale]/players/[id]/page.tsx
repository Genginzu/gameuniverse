import { notFound } from "next/navigation";
import { PlayerDetailsContent } from "@/components/players/PlayerDetailsContent";
import { PlayerService } from "@/lib/services/playerService";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

interface PlayerDetailsPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function PlayerDetailsPage({ params }: PlayerDetailsPageProps) {
  const { locale, id } = await params;

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
              title={locale === "fr" ? "Erreur de chargement" : "Loading Error"}
              description={
                locale === "fr"
                  ? "Une erreur s'est produite lors de l'affichage du profil du joueur."
                  : "An error occurred while displaying player profile."
              }
              showBackButton={true}
              backUrl={`/${locale}/players`}
              backLabel={locale === "fr" ? "Retour aux joueurs" : "Back to players"}
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
          title={locale === "fr" ? "Erreur de chargement" : "Loading Error"}
          description={
            locale === "fr"
              ? "Impossible de charger le profil du joueur."
              : "Unable to load player profile."
          }
          showBackButton={true}
          backUrl={`/${locale}/players`}
          backLabel={locale === "fr" ? "Retour aux joueurs" : "Back to players"}
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
