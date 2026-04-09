import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import DiscussionsPage from "@/components/discussions/DiscussionsPage";

interface DiscussionsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: DiscussionsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.discussions" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: { fr: "/fr/discussions", en: "/en/discussions" },
    },
  };
}

export default async function DiscussionsPageRoute({ params }: DiscussionsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "discussions" });

  return (
    <DashboardLayout>
      <ErrorBoundary
        fallback={
          <ErrorFallback description={t("pageTitle")} showRefresh={true} showHomeButton={true} />
        }
      >
        <DiscussionsPage />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
