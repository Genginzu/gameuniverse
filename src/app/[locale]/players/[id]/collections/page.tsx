import { notFound } from "next/navigation";
import { CollectionsPageContent } from "@/components/collections/CollectionsPageContent";
import { PlayerService } from "@/lib/services/playerService";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { getTranslations } from "next-intl/server";

interface CollectionsPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function CollectionsPage({ params }: CollectionsPageProps) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "collections.page" });

  if (!PlayerService.validatePlayerId(id)) {
    notFound();
  }

  return (
    <ErrorBoundary
      fallback={
        <ErrorFallback
          title={t("errorTitle")}
          description={t("errorDescription")}
          showRefresh
          showBackButton
          backUrl={`/${locale}/players/${id}`}
          backLabel={t("backToPlayer")}
          locale={locale}
        />
      }
    >
      <CollectionsPageContent playerId={id} locale={locale} />
    </ErrorBoundary>
  );
}

export async function generateMetadata({ params }: CollectionsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "collections.page" });

  return {
    title: `${t("title")} | Game Universe`,
  };
}
