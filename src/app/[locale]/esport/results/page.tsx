import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EsportShell } from "@/components/esport/EsportShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import {
  EsportResultsContent,
  type EsportResultsData,
} from "@/components/esport/EsportResultsContent";
import { esportResultsListing } from "@/lib/listing/resources/esport";
import { fetchListingDefault } from "@/lib/listing/server";

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "esport.results" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function EsportResultsPage({ params }: Props) {
  const { locale } = await params;
  const [initialData, tErrors] = await Promise.all([
    fetchListingDefault<EsportResultsData>(esportResultsListing, { locale }),
    getTranslations({ locale, namespace: "errors.pageLoad" }),
  ]);

  return (
    <EsportShell>
      <ErrorBoundary
        fallback={
          <ErrorFallback description={tErrors("esportResults")} showRefresh showHomeButton />
        }
      >
        <EsportResultsContent initialData={initialData} />
      </ErrorBoundary>
    </EsportShell>
  );
}
