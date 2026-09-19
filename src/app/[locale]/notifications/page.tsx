import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { NotificationCenterContent } from "@/components/notifications/NotificationCenterContent";

interface NotificationsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: NotificationsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.notifications" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: { fr: "/fr/notifications", en: "/en/notifications" },
    },
  };
}

export default async function NotificationsPageRoute({ params }: NotificationsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "notificationCenter" });

  return (
    <EditorialShell>
      <ErrorBoundary
        fallback={<ErrorFallback description={t("loadingError")} showRefresh showHomeButton />}
      >
        <NotificationCenterContent />
      </ErrorBoundary>
    </EditorialShell>
  );
}
