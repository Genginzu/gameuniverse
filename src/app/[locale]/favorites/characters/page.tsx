"use client";

import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { GridSkeleton } from "@/components/shared/GridSkeleton";
import { characterSkeletonConfig } from "@/components/shared/EntitySkeleton";
import { useTranslations } from "next-intl";

const FavoriteCharactersContent = dynamic(
  () =>
    import("@/components/characters/favorites/FavoriteCharactersContent").then(
      (mod) => mod.FavoriteCharactersContent
    ),
  {
    loading: () => (
      <div className="p-4 sm:p-6">
        <GridSkeleton skeletonConfig={characterSkeletonConfig} count={8} />
      </div>
    ),
  }
);

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
