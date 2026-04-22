import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { UpcomingContent } from "@/components/games/UpcomingContent";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";

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

export default function UpcomingPage() {
  return (
    <DashboardLayout>
      <UpcomingContent />
    </DashboardLayout>
  );
}
