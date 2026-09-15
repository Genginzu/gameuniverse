import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { BacklogManager } from "@/components/library/backlog/BacklogManager";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

interface BacklogPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: BacklogPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "userLibrary.backlog" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      languages: { fr: "/fr/library/backlog", en: "/en/library/backlog" },
    },
  };
}

export default async function BacklogPage({ params }: BacklogPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "userLibrary.errors" });

  return (
    <EditorialShell>
      <ErrorBoundary
        fallback={
          <ErrorFallback
            description={t("loadingDescription")}
            showRefresh={true}
            showHomeButton={true}
          />
        }
      >
        <BacklogManager locale={locale} />
      </ErrorBoundary>
    </EditorialShell>
  );
}
