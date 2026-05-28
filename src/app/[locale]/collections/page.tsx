import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CollectionsEditorial } from "@/components/collections/CollectionsEditorial";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

interface CollectionsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: CollectionsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.collections" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: { fr: "/fr/collections", en: "/en/collections" },
    },
  };
}

export default async function CollectionsPage({ params }: CollectionsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "collections.page" });

  return (
    <EditorialShell>
      <ErrorBoundary
        fallback={
          <ErrorFallback
            title={t("errorTitle")}
            description={t("errorDescription")}
            showRefresh
            showHomeButton
          />
        }
      >
        <CollectionsEditorial />
      </ErrorBoundary>
    </EditorialShell>
  );
}
