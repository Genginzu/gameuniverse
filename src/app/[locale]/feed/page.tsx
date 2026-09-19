import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { FeedPageContent } from "@/components/feed/FeedPageContent";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { createServerClient } from "@/lib/supabase-server";

interface FeedPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: FeedPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.feed" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: { fr: "/fr/feed", en: "/en/feed" },
    },
  };
}

export default async function FeedPage({ params }: FeedPageProps) {
  const { locale } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth`);
  }

  const t = await getTranslations({ locale, namespace: "feedPage" });

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
        <FeedPageContent locale={locale} />
      </ErrorBoundary>
    </EditorialShell>
  );
}
