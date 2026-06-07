import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LibraryEditorial } from "@/components/library/LibraryEditorial";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

interface LibraryPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LibraryPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.library" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: { fr: "/fr/library", en: "/en/library" },
    },
  };
}

export default async function LibraryPage({ params }: LibraryPageProps) {
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
        <LibraryEditorial locale={locale} />
      </ErrorBoundary>
    </EditorialShell>
  );
}
