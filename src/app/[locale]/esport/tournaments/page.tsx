import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EsportShell } from "@/components/esport/EsportShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { EsportTournamentsContent, type EsportTournamentsData } from "@/components/esport/EsportTournamentsContent";
import { logger } from "@/lib/logger";

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "esport.tournaments" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function EsportTournamentsPage() {
  let initialData: EsportTournamentsData | undefined;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/esport/tournaments`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      initialData = await res.json();
    }
  } catch (error) {
    logger.error("Failed to fetch esport tournaments server-side", { error });
  }

  return (
    <EsportShell>
      <ErrorBoundary
        fallback={
          <ErrorFallback
            description="An error occurred while loading the esport tournaments."
            showRefresh={true}
            showHomeButton={true}
          />
        }
      >
        <EsportTournamentsContent initialData={initialData} />
      </ErrorBoundary>
    </EsportShell>
  );
}
