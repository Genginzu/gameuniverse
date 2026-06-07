import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EsportShell } from "@/components/esport/EsportShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { EsportCalendarDayContent } from "@/components/esport/EsportCalendarDayContent";

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string; date: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, date } = await params;
  const t = await getTranslations({ locale, namespace: "esport.calendar" });
  return {
    title: `${t("metaTitle")} - ${date}`,
    description: t("metaDescription"),
  };
}

export default async function EsportCalendarDayPage({ params }: Props) {
  const { date } = await params;

  return (
    <EsportShell>
      <ErrorBoundary
        fallback={
          <ErrorFallback
            description="An error occurred while loading the day matches."
            showRefresh={true}
            showHomeButton={true}
          />
        }
      >
        <EsportCalendarDayContent date={date} />
      </ErrorBoundary>
    </EsportShell>
  );
}
