import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { HomeContent } from "@/components/home/HomeContent";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { JsonLd } from "@/components/shared/JsonLd";
import { logger } from "@/lib/logger";
import type { GameSummary } from "@/types/game";

export const revalidate = 300;

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

interface HomeApiResponse {
  trending: GameSummary[];
  upcoming: GameSummary[];
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.home" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: { fr: "/fr", en: "/en" },
    },
  };
}

export default async function Home({ params }: HomePageProps) {
  const { locale } = await params;

  let initialHomeData: HomeApiResponse | undefined;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/home?locale=${locale}`, {
      next: { revalidate: 300 },
    });

    if (res.ok) {
      initialHomeData = (await res.json()) as HomeApiResponse;
    }
  } catch (error) {
    logger.error("Failed to fetch initial home data server-side", { error });
  }

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Gamers Universe",
          url: "https://gameuniverse.gg",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `https://gameuniverse.gg/${locale}/games?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <EditorialShell>
        <ErrorBoundary
          fallback={
            <ErrorFallback
              description="Une erreur s'est produite lors du chargement de la page d'accueil."
              showRefresh={true}
            />
          }
        >
          <HomeContent initialHomeData={initialHomeData} />
        </ErrorBoundary>
      </EditorialShell>
    </>
  );
}
