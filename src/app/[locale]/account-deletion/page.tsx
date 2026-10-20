import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { AccountDeletionPendingContent } from "@/components/settings/AccountDeletionPendingContent";
import { createServerClient } from "@/lib/supabase-server";

interface AccountDeletionPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AccountDeletionPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "accountDeletion.pending" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

/** Landing page of a deactivated account: cancel the deletion or sign out. */
export default async function AccountDeletionPage({ params }: AccountDeletionPageProps) {
  const { locale } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("deletion_scheduled_for")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.deletion_scheduled_for) redirect(`/${locale}/settings`);

  return (
    <EditorialShell>
      <AccountDeletionPendingContent scheduledFor={profile.deletion_scheduled_for} />
    </EditorialShell>
  );
}
