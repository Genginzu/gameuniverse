"use client";

import { FriendsPageContent } from "@/components/friends/FriendsPageContent";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { useTranslations } from "next-intl";

export default function FriendsPage() {
  const t = useTranslations("friends.page");

  return (
    <DashboardLayout>
      <ErrorBoundary
        fallback={
          <ErrorFallback description={t("loadingError")} showRefresh={true} showHomeButton={true} />
        }
      >
        <FriendsPageContent />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
