import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AllPlayersContent } from "@/components/players/AllPlayersContent";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

interface AllPlayersPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AllPlayersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.players" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: { fr: "/fr/players", en: "/en/players" },
    },
  };
}

export default function AllPlayersPage() {
  return (
    <EditorialShell>
      <ErrorBoundary
        fallback={
          <ErrorFallback
            description="Une erreur s'est produite lors du chargement de la page des joueurs."
            showRefresh={true}
            showHomeButton={true}
          />
        }
      >
        <AllPlayersContent />
      </ErrorBoundary>
    </EditorialShell>
  );
}
