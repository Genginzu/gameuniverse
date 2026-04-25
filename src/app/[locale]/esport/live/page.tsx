import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { EsportLiveContent } from "@/components/esport/EsportLiveContent";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "esport.live" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default function EsportLivePage() {
  return (
    <DashboardLayout>
      <ErrorBoundary
        fallback={<ErrorFallback description="Error loading live streams." showRefresh showHomeButton />}
      >
        <EsportLiveContent />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
