import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AllGamesContent } from "@/components/games/AllGamesContent";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

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

export default function AllGamesPage() {
  return (
    <DashboardLayout>
      <ErrorBoundary
        fallback={
          <ErrorFallback
            description="Une erreur s'est produite lors du chargement de la page des jeux."
            showRefresh={true}
            showHomeButton={true}
          />
        }
      >
        <AllGamesContent />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
