import { notFound } from "next/navigation";
import { CollectionDetailPageContent } from "@/components/collections/CollectionDetailPageContent";
import { PlayerService } from "@/lib/services/playerService";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { getTranslations } from "next-intl/server";

interface CollectionDetailPageProps {
  params: Promise<{
    locale: string;
    id: string;
    slug: string;
  }>;
}

export default async function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const { locale, id, slug } = await params;
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
          backUrl={`/${locale}/players/${id}/collections`}
          backLabel={t("backToCollections")}
          locale={locale}
        />
      }
    >
      <CollectionDetailPageContent playerId={id} slug={slug} locale={locale} />
    </ErrorBoundary>
  );
}

export async function generateMetadata({ params }: CollectionDetailPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "collections.page" });

  return {
    title: `${t("title")} | Gamers Universe`,
  };
}
