import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminDisputesContent } from "@/components/admin/coaching/AdminDisputesContent";

interface Props { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.disputes" });
  return { title: t("title") };
}

export default function AdminDisputesPage() {
  return <AdminDisputesContent />;
}
