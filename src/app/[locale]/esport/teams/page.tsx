import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EsportShell } from "@/components/esport/EsportShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { EsportTeamsContent, type EsportTeamsData } from "@/components/esport/EsportTeamsContent";
import { esportTeamsListing } from "@/lib/listing/resources/esport";
import { fetchListingDefault } from "@/lib/listing/server";

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "esport.teams" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function EsportTeamsPage({ params }: Props) {
  const { locale } = await params;
  const [initialData, tErrors] = await Promise.all([
    fetchListingDefault<EsportTeamsData>(esportTeamsListing, { locale }),
    getTranslations({ locale, namespace: "errors.pageLoad" }),
  ]);

  return (
    <EsportShell>
      <ErrorBoundary
        fallback={<ErrorFallback description={tErrors("esportTeams")} showRefresh showHomeButton />}
      >
        <EsportTeamsContent initialData={initialData} />
      </ErrorBoundary>
    </EsportShell>
  );
}
