import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TrendingContent, type TrendingData } from "@/components/games/TrendingContent";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { logger } from "@/lib/logger";

export const revalidate = 300;

interface TrendingPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: TrendingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "trending" });

  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function TrendingPage({ params }: TrendingPageProps) {
  const { locale } = await params;

  let initialData: TrendingData | undefined;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/games/trending?locale=${locale}&limit=12`, {
      next: { revalidate: 300 },
    });

    if (res.ok) {
      initialData = await res.json();
    }
  } catch (error) {
    logger.error("Failed to fetch trending data server-side", { error });
  }

  return (
    <DashboardLayout>
      <TrendingContent initialData={initialData} />
    </DashboardLayout>
  );
}
