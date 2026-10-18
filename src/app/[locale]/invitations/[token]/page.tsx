import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { InvitationPageContent } from "@/components/groups/InvitationPageContent";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

interface InvitationPageProps {
  params: Promise<{ locale: string; token: string }>;
}

export async function generateMetadata({ params }: InvitationPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "groups.invitationPage" });

  return { title: t("kicker") };
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { locale, token } = await params;
  const t = await getTranslations({ locale, namespace: "groups.detail" });

  return (
    <EditorialShell>
      <ErrorBoundary
        fallback={
          <ErrorFallback
            title={t("errorTitle")}
            description={t("errorDescription")}
            showRefresh
            showHomeButton
          />
        }
      >
        <InvitationPageContent token={token} />
      </ErrorBoundary>
    </EditorialShell>
  );
}
