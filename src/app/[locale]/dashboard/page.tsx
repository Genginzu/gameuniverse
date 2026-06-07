import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { DashboardEditorial } from "@/components/dashboard/DashboardEditorial";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { createServerClient } from "@/lib/supabase-server";

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: DashboardPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.dashboard" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: { fr: "/fr/dashboard", en: "/en/dashboard" },
    },
  };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth`);
  }

  const username =
    (user.user_metadata?.username as string | undefined) || user.email?.split("@")[0] || "";

  return (
    <EditorialShell>
      <DashboardEditorial
        user={{
          id: user.id,
          email: user.email ?? "",
          username,
          createdAt: user.created_at,
        }}
      />
    </EditorialShell>
  );
}
