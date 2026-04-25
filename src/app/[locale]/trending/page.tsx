import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TrendingContent } from "@/components/games/TrendingContent";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";

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

export default function TrendingPage() {
  return (
    <DashboardLayout>
      <TrendingContent />
    </DashboardLayout>
  );
}
