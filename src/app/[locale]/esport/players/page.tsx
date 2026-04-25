import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { EsportPlayersContent } from "@/components/esport/EsportPlayersContent";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "esport.players" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default function EsportPlayersPage() {
  return (
    <DashboardLayout>
      <ErrorBoundary
        fallback={<ErrorFallback description="Error loading esport players." showRefresh showHomeButton />}
      >
        <EsportPlayersContent />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
