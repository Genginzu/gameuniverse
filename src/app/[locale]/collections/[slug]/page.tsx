import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CollectionDetailEditorial } from "@/components/collections/CollectionDetailEditorial";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

interface CollectionDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: CollectionDetailPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.collections" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "collections.page" });

  return (
    <EditorialShell>
      <ErrorBoundary
        fallback={
          <ErrorFallback
            title={t("errorTitle")}
            description={t("errorDescription")}
            showRefresh
            showBackButton
            backUrl={`/${locale}/collections`}
            backLabel={t("backToCollections")}
            locale={locale}
          />
        }
      >
        <CollectionDetailEditorial slug={slug} locale={locale} />
      </ErrorBoundary>
    </EditorialShell>
  );
}
