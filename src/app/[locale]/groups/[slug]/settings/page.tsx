import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { GroupSettingsContent } from "@/components/groups/GroupSettingsContent";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

interface GroupSettingsPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: GroupSettingsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "groups.settings" });

  return { title: t("title") };
}

export default async function GroupSettingsPage({ params }: GroupSettingsPageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "groups.detail" });

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
        <GroupSettingsContent slug={slug} />
      </ErrorBoundary>
    </EditorialShell>
  );
}
