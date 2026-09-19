import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CommunitiesEditorial } from "@/components/communities/CommunitiesEditorial";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

interface CommunitiesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CommunitiesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.communities" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: { fr: "/fr/communities", en: "/en/communities" },
    },
  };
}

export default async function CommunitiesPage({ params }: CommunitiesPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "communities.page" });

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
        <CommunitiesEditorial />
      </ErrorBoundary>
    </EditorialShell>
  );
}
