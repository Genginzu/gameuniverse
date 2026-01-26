import { notFound } from "next/navigation";
import { CharacterDetailsContent } from "@/components/characters/CharacterDetailsContent";
import { CharacterService } from "@/lib/services/characterService";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { getTranslations } from "next-intl/server";

interface CharacterDetailsPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export default async function CharacterDetailsPage({ params }: CharacterDetailsPageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "characters.errors" });

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
              title={t("loadingTitle")}
              description={t("detailsLoadingDescription")}
              showBackButton={true}
              backUrl={`/${locale}/characters`}
              backLabel={t("backToCharacters")}
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
          title={t("loadingTitle")}
          description={t("unableToLoad")}
          showBackButton={true}
          backUrl={`/${locale}/characters`}
          backLabel={t("backToCharacters")}
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
