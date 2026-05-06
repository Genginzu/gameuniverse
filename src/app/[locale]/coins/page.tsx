import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CoinHistoryContent } from "@/components/coins/CoinHistoryContent";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

interface CoinHistoryPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CoinHistoryPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.coins" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function CoinHistoryPage({ params }: CoinHistoryPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "coins" });

  return (
    <DashboardLayout>
      <ErrorBoundary
        fallback={<ErrorFallback description={t("errorLoading")} showRefresh showHomeButton />}
      >
        <CoinHistoryContent />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
