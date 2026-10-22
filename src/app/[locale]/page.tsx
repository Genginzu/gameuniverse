import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { HomeContent } from "@/components/home/HomeContent";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { JsonLd } from "@/components/shared/JsonLd";
import { fetchInternalApi } from "@/lib/listing/server";
import { getSiteUrl } from "@/lib/utils/siteUrl";
import type { HomeApiResponse } from "@/types/home";

export const revalidate = 300;

interface HomePageProps {
  params: Promise<{ locale: string }>;
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
  const [initialHomeData, tErrors] = await Promise.all([
    fetchInternalApi<HomeApiResponse>(`/api/home?locale=${locale}`, revalidate),
    getTranslations({ locale, namespace: "errors.pageLoad" }),
  ]);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Gamers Universe",
          url: getSiteUrl(),
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${getSiteUrl()}/${locale}/games?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <EditorialShell>
        <ErrorBoundary
          fallback={<ErrorFallback description={tErrors("home")} showRefresh={true} />}
        >
          <HomeContent initialHomeData={initialHomeData} />
        </ErrorBoundary>
      </EditorialShell>
    </>
  );
}
