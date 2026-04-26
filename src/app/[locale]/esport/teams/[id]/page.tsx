import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { EsportTeamDetailContent } from "@/components/esport/EsportTeamDetailContent";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "esport.teams" });
  return { title: t("detailMetaTitle"), description: t("metaDescription") };
}

export default async function EsportTeamDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <DashboardLayout>
      <ErrorBoundary
        fallback={<ErrorFallback description="Error loading team." showRefresh showHomeButton />}
      >
        <EsportTeamDetailContent teamId={id} />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
