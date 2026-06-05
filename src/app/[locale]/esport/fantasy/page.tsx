import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EsportShell } from "@/components/esport/EsportShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { EsportFantasyContent } from "@/components/esport/EsportFantasyContent";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "esport.fantasy" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default function EsportFantasyPage() {
  return (
    <EsportShell>
      <ErrorBoundary
        fallback={<ErrorFallback description="Error loading fantasy." showRefresh showHomeButton />}
      >
        <EsportFantasyContent />
      </ErrorBoundary>
    </EsportShell>
  );
}
