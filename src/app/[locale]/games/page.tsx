import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { GamesListingEditorial } from "@/components/games/GamesListingEditorial";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { logger } from "@/lib/logger";

export const revalidate = 300;

interface AllGamesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AllGamesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.games" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: { fr: "/fr/games", en: "/en/games" },
    },
  };
}

export default async function AllGamesPage({ params }: AllGamesPageProps) {
  const { locale } = await params;

  let initialGames;
  let initialPagination;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/games?locale=${locale}&page=1&limit=20`, {
      next: { revalidate: 300 },
    });

    if (res.ok) {
      const data = await res.json();
      initialGames = data.games;
      initialPagination = data.pagination;
    }
  } catch (error) {
    logger.error("Failed to fetch initial games server-side", { error });
  }

  return (
    <EditorialShell>
      <ErrorBoundary
        fallback={
          <ErrorFallback
            description="Une erreur s'est produite lors du chargement de la page des jeux."
            showRefresh={true}
            showHomeButton={true}
          />
        }
      >
        <GamesListingEditorial
          locale={locale}
          initialGames={initialGames}
          initialPagination={initialPagination}
        />
      </ErrorBoundary>
    </EditorialShell>
  );
}
