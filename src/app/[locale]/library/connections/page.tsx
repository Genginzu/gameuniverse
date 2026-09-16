import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ConnectionsContent } from "@/components/library/connections/ConnectionsContent";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { createServerClient } from "@/lib/supabase-server";

interface ConnectionsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ConnectionsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.connections" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: { fr: "/fr/library/connections", en: "/en/library/connections" },
    },
  };
}

export default async function ConnectionsPage({ params }: ConnectionsPageProps) {
  const { locale } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Page propre à l'utilisateur connecté : redirige vers l'auth sans session.
  if (!user) {
    redirect(`/${locale}/auth`);
  }

  return (
    <EditorialShell>
      <ConnectionsContent />
    </EditorialShell>
  );
}
