import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CommunityDetailEditorial } from "@/components/communities/CommunityDetailEditorial";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

interface CommunityDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: CommunityDetailPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.communities" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function CommunityDetailPage({ params }: CommunityDetailPageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "communities.page" });

  return (
    <EditorialShell>
      <ErrorBoundary
        fallback={
          <ErrorFallback
            title={t("errorTitle")}
            description={t("errorDescription")}
            showRefresh
            showBackButton
            backUrl={`/${locale}/communities`}
            backLabel={t("backToCommunities")}
            locale={locale}
          />
        }
      >
        <CommunityDetailEditorial slug={slug} />
      </ErrorBoundary>
    </EditorialShell>
  );
}
