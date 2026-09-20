import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CommunitySettingsContent } from "@/components/communities/CommunitySettingsContent";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

interface CommunitySettingsPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: CommunitySettingsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "communities.settings" });

  return { title: t("title") };
}

export default async function CommunitySettingsPage({ params }: CommunitySettingsPageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "communities.detail" });

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
        <CommunitySettingsContent slug={slug} />
      </ErrorBoundary>
    </EditorialShell>
  );
}
