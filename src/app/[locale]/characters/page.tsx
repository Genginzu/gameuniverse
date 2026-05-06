import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AllCharactersContent } from "@/components/characters/AllCharactersContent";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { logger } from "@/lib/logger";

export const revalidate = 300;

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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/characters?locale=${locale}&page=1&limit=20`, {
      next: { revalidate: 300 },
    });

    if (res.ok) {
      const data = await res.json();
      initialCharacters = data.characters;
      initialPagination = data.pagination;
    }
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
