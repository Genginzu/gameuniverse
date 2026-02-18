"use client";

import { FavoriteCharactersContent } from "@/components/characters/favorites/FavoriteCharactersContent";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { useTranslations } from "next-intl";

export default function FavoriteCharactersPage() {
  const t = useTranslations("characters.favorites");

  return (
    <DashboardLayout>
      <ErrorBoundary
        fallback={
          <ErrorFallback description={t("errorTitle")} showRefresh={true} showHomeButton={true} />
        }
      >
        <FavoriteCharactersContent />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
