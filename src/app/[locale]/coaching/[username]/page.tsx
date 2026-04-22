import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CoachProfileContent } from "@/components/coaching/CoachProfileContent";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";

interface Props {
  params: Promise<{ locale: string; username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username } = await params;
  const t = await getTranslations({ locale, namespace: "coaching" });
  return { title: `${username} — ${t("publicProfile.title")}` };
}

export default async function CoachProfilePage({ params }: Props) {
  const { username } = await params;
  return (
    <DashboardLayout>
      <CoachProfileContent username={username} />
    </DashboardLayout>
  );
}
