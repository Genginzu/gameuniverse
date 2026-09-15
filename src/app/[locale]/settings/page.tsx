import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { SettingsContent } from "@/components/settings/SettingsContent";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { createServerClient } from "@/lib/supabase-server";

interface SettingsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: SettingsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "settings" });

  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      languages: { fr: "/fr/settings", en: "/en/settings" },
    },
  };
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Les paramètres sont propres à l'utilisateur connecté : redirige vers l'auth
  // si aucune session.
  if (!user) {
    redirect(`/${locale}/auth`);
  }

  return (
    <EditorialShell>
      <SettingsContent />
    </EditorialShell>
  );
}
