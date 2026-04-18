import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { HomeContent } from "@/components/home/HomeContent";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { JsonLd } from "@/components/shared/JsonLd";

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
      <DashboardLayout>
        <ErrorBoundary
          fallback={
            <ErrorFallback
              description="Une erreur s'est produite lors du chargement de la page d'accueil."
              showRefresh={true}
            />
          }
        >
          <HomeContent />
        </ErrorBoundary>
      </DashboardLayout>
    </>
  );
}
