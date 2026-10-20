import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminAccountDeletionsContent } from "@/components/admin/account-deletions/AdminAccountDeletionsContent";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.accountDeletions" });
  return { title: t("title") };
}

export default function AdminAccountDeletionsPage() {
  return <AdminAccountDeletionsContent />;
}
