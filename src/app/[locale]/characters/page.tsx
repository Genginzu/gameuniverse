import { AllCharactersContent } from "@/components/characters/AllCharactersContent";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { CharacterService } from "@/lib/services/characterService";
import { logger } from "@/lib/logger";

interface AllCharactersPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AllCharactersPage({ params }: AllCharactersPageProps) {
  const { locale } = await params;

  // Fetch initial data server-side pour un rendu immédiat sans skeleton
  let initialCharacters;
  let initialPagination;

  try {
    const result = await CharacterService.fetchCharactersFromDB({
      locale,
      page: 1,
      limit: 20,
    });
    initialCharacters = result.characters;
    initialPagination = result.pagination;
  } catch (error) {
    // En cas d'erreur serveur, le composant client fera le fetch en fallback
    logger.error("Failed to fetch initial characters server-side", { error });
  }

  return (
    <DashboardLayout>
      <ErrorBoundary
        fallback={
          <ErrorFallback
            description="Une erreur s'est produite lors du chargement de la page des personnages."
            showRefresh={true}
            showHomeButton={true}
          />
        }
      >
        <AllCharactersContent
          locale={locale}
          initialCharacters={initialCharacters}
          initialPagination={initialPagination}
        />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
