import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CoachingSessionsContent } from "@/components/coaching/CoachingSessionsContent";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "coaching.sessions" });
  return { title: t("title") };
}

export default function CoachingSessionsPage() {
  return (
    <DashboardLayout>
      <CoachingSessionsContent />
    </DashboardLayout>
  );
}
