import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { GroupDetailEditorial } from "@/components/groups/GroupDetailEditorial";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

interface GroupDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: GroupDetailPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.groups" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "groups.page" });

  return (
    <EditorialShell>
      <ErrorBoundary
        fallback={
          <ErrorFallback
            title={t("errorTitle")}
            description={t("errorDescription")}
            showRefresh
            showBackButton
            backUrl={`/${locale}/groups`}
            backLabel={t("backToGroups")}
            locale={locale}
          />
        }
      >
        <GroupDetailEditorial slug={slug} />
      </ErrorBoundary>
    </EditorialShell>
  );
}
