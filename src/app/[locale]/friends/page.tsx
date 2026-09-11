import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { FriendsPageContent } from "@/components/players/friends/FriendsPageContent";

interface FriendsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: FriendsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.friends" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: { fr: "/fr/friends", en: "/en/friends" },
    },
  };
}

export default async function FriendsPageRoute({ params }: FriendsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "friends.page" });

  return (
    <EditorialShell>
      <ErrorBoundary
        fallback={<ErrorFallback description={t("loadingError")} showRefresh showHomeButton />}
      >
        <FriendsPageContent />
      </ErrorBoundary>
    </EditorialShell>
  );
}
