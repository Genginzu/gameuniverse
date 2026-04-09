import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AllCharactersContent } from "@/components/characters/AllCharactersContent";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { CharacterService } from "@/lib/services/characterService";
import { logger } from "@/lib/logger";

interface AllCharactersPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AllCharactersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.characters" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: { fr: "/fr/characters", en: "/en/characters" },
    },
  };
}

export default async function AllCharactersPage({ params }: AllCharactersPageProps) {
  const { locale } = await params;

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
