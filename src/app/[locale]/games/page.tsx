import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { GamesListingEditorial } from "@/components/games/GamesListingEditorial";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { gamesListing } from "@/lib/listing/resources/games";
import { fetchListingDefault } from "@/lib/listing/server";
import type { GamesApiResponse } from "@/types/game";

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
  const [initialData, tErrors] = await Promise.all([
    fetchListingDefault<GamesApiResponse>(gamesListing, { locale }),
    getTranslations({ locale, namespace: "errors.pageLoad" }),
  ]);

  return (
    <EditorialShell>
      <ErrorBoundary
        fallback={
          <ErrorFallback description={tErrors("games")} showRefresh={true} showHomeButton={true} />
        }
      >
        <GamesListingEditorial locale={locale} initialData={initialData} />
      </ErrorBoundary>
    </EditorialShell>
  );
}
