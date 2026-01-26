"use client";

import { LibraryGamesContent } from "@/components/library/LibraryGamesContent";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { useTranslations } from "next-intl";

export default function LibraryPage() {
  const t = useTranslations("userLibrary.errors");

  return (
    <DashboardLayout>
      <ErrorBoundary
        fallback={
          <ErrorFallback
            description={t("loadingDescription")}
            showRefresh={true}
            showHomeButton={true}
          />
        }
      >
        <LibraryGamesContent />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
