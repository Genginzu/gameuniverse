import { notFound } from "next/navigation";
import { CharacterDetailsContent } from "@/components/characters/CharacterDetailsContent";
import { CharacterService } from "@/lib/services/characterService";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

interface CharacterDetailsPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export default async function CharacterDetailsPage({ params }: CharacterDetailsPageProps) {
  const { locale, slug } = await params;

  try {
    const character = await CharacterService.fetchCharacterDetails(slug, locale);

    if (!character) {
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
                  ? "Une erreur s'est produite lors de l'affichage des détails du personnage."
                  : "An error occurred while displaying character details."
              }
              showBackButton={true}
              backUrl={`/${locale}/characters`}
              backLabel={locale === "fr" ? "Retour aux personnages" : "Back to characters"}
              locale={locale}
            />
          }
        >
          <CharacterDetailsContent character={character} locale={locale} />
        </ErrorBoundary>
      </DashboardLayout>
    );
  } catch (error) {
    console.error("Error in CharacterDetailsPage:", error);
    // Return error state
    return (
      <DashboardLayout>
        <ErrorFallback
          title={locale === "fr" ? "Erreur de chargement" : "Loading Error"}
          description={
            locale === "fr"
              ? "Impossible de charger les détails du personnage."
              : "Unable to load character details."
          }
          showBackButton={true}
          backUrl={`/${locale}/characters`}
          backLabel={locale === "fr" ? "Retour aux personnages" : "Back to characters"}
          locale={locale}
        />
      </DashboardLayout>
    );
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CharacterDetailsPageProps) {
  const { locale, slug } = await params;

  return await CharacterService.generateCharacterMetadata(slug, locale);
}
