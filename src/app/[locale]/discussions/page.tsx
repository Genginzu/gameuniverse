"use client";

import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import DiscussionsPage from "@/components/discussions/DiscussionsPage";
import { useTranslations } from "next-intl";

export default function DiscussionsPageRoute() {
  const t = useTranslations("discussions");

  return (
    <DashboardLayout>
      <ErrorBoundary
        fallback={
          <ErrorFallback description={t("pageTitle")} showRefresh={true} showHomeButton={true} />
        }
      >
        <DiscussionsPage />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
