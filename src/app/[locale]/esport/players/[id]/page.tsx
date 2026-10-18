import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EsportShell } from "@/components/esport/EsportShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import {
  EsportPlayerDetailContent,
  type EsportPlayerDetailData,
} from "@/components/esport/EsportPlayerDetailContent";
import { fetchInternalApi } from "@/lib/listing/server";

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "esport.players" });
  return { title: t("detailMetaTitle"), description: t("metaDescription") };
}

export default async function EsportPlayerDetailPage({ params }: Props) {
  const { locale, id } = await params;
  const [initialData, tErrors] = await Promise.all([
    fetchInternalApi<EsportPlayerDetailData>(`/api/esport/players/${id}`, revalidate),
    getTranslations({ locale, namespace: "errors.pageLoad" }),
  ]);

  return (
    <EsportShell>
      <ErrorBoundary
        fallback={
          <ErrorFallback description={tErrors("esportPlayer")} showRefresh showHomeButton />
        }
      >
        <EsportPlayerDetailContent playerId={id} initialData={initialData} />
      </ErrorBoundary>
    </EsportShell>
  );
}
