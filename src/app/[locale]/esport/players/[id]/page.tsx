import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { EsportPlayerDetailContent } from "@/components/esport/EsportPlayerDetailContent";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "esport.players" });
  return { title: t("detailMetaTitle"), description: t("metaDescription") };
}

export default async function EsportPlayerDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <DashboardLayout>
      <ErrorBoundary
        fallback={<ErrorFallback description="Error loading player." showRefresh showHomeButton />}
      >
        <EsportPlayerDetailContent playerId={id} />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
