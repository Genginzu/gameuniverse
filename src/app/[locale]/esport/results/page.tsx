import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { EsportResultsContent, type EsportResultsData } from "@/components/esport/EsportResultsContent";
import { logger } from "@/lib/logger";

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "esport.results" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function EsportResultsPage() {
  let initialData: EsportResultsData | undefined;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/esport/results`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      initialData = await res.json();
    }
  } catch (error) {
    logger.error("Failed to fetch esport results server-side", { error });
  }

  return (
    <DashboardLayout>
      <ErrorBoundary
        fallback={
          <ErrorFallback description="Error loading esport results." showRefresh showHomeButton />
        }
      >
        <EsportResultsContent initialData={initialData} />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
