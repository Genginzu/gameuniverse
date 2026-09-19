import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { GroupsEditorial } from "@/components/groups/GroupsEditorial";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

interface GroupsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: GroupsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.groups" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: { fr: "/fr/groups", en: "/en/groups" },
    },
  };
}

export default async function GroupsPage({ params }: GroupsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "groups.page" });

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
        <GroupsEditorial />
      </ErrorBoundary>
    </EditorialShell>
  );
}
