import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { UpcomingContent, type UpcomingResponse } from "@/components/games/UpcomingContent";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { logger } from "@/lib/logger";

export const revalidate = 300;

interface UpcomingPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: UpcomingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "upcoming" });

  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function UpcomingPage({ params }: UpcomingPageProps) {
  const { locale } = await params;

  let initialData: UpcomingResponse | undefined;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/games/upcoming?locale=${locale}&page=1&limit=24`, {
      next: { revalidate: 300 },
    });

    if (res.ok) {
      initialData = await res.json();
    }
  } catch (error) {
    logger.error("Failed to fetch upcoming data server-side", { error });
  }

  return (
    <DashboardLayout>
      <UpcomingContent initialData={initialData} />
    </DashboardLayout>
  );
}
