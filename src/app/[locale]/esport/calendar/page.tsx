import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EsportShell } from "@/components/esport/EsportShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { EsportCalendarMonthly } from "@/components/esport/EsportCalendarMonthly";

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "esport.calendar" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function EsportCalendarPage() {
  return (
    <EsportShell>
      <ErrorBoundary
        fallback={
          <ErrorFallback
            description="An error occurred while loading the esport calendar."
            showRefresh={true}
            showHomeButton={true}
          />
        }
      >
        <EsportCalendarMonthly />
      </ErrorBoundary>
    </EsportShell>
  );
}
