import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { EsportPlayersContent, type EsportPlayersData } from "@/components/esport/EsportPlayersContent";
import { logger } from "@/lib/logger";

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "esport.players" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function EsportPlayersPage() {
  let initialData: EsportPlayersData | undefined;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/esport/players`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      initialData = await res.json();
    }
  } catch (error) {
    logger.error("Failed to fetch esport players server-side", { error });
  }

  return (
    <DashboardLayout>
      <ErrorBoundary
        fallback={
          <ErrorFallback description="Error loading esport players." showRefresh showHomeButton />
        }
      >
        <EsportPlayersContent initialData={initialData} />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
