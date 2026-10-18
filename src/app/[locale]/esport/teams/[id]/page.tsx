import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EsportShell } from "@/components/esport/EsportShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import {
  EsportTeamDetailContent,
  type EsportTeamDetailData,
} from "@/components/esport/EsportTeamDetailContent";
import { fetchInternalApi } from "@/lib/listing/server";

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "esport.teams" });
  return { title: t("detailMetaTitle"), description: t("metaDescription") };
}

export default async function EsportTeamDetailPage({ params }: Props) {
  const { locale, id } = await params;
  const [initialData, tErrors] = await Promise.all([
    fetchInternalApi<EsportTeamDetailData>(`/api/esport/teams/${id}`, revalidate),
    getTranslations({ locale, namespace: "errors.pageLoad" }),
  ]);

  return (
    <EsportShell>
      <ErrorBoundary
        fallback={<ErrorFallback description={tErrors("esportTeam")} showRefresh showHomeButton />}
      >
        <EsportTeamDetailContent teamId={id} initialData={initialData} />
      </ErrorBoundary>
    </EsportShell>
  );
}
