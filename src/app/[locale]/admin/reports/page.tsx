import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminReportsContent } from "@/components/admin/reports/AdminReportsContent";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.reports" });
  return { title: t("title") };
}

export default function AdminReportsPage() {
  return <AdminReportsContent />;
}
