import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminCoachingContent } from "@/components/admin/coaching/AdminCoachingContent";

interface Props { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.coaching" });
  return { title: t("title") };
}

export default function AdminCoachingPage() {
  return <AdminCoachingContent />;
}
