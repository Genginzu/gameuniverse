import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { GridSkeleton } from "@/components/shared/GridSkeleton";
import { characterSkeletonConfig } from "@/components/shared/EntitySkeleton";

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

interface FavoriteCharactersPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: FavoriteCharactersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.favorites" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: { fr: "/fr/favorites/characters", en: "/en/favorites/characters" },
    },
  };
}

export default async function FavoriteCharactersPage({ params }: FavoriteCharactersPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "characters.favorites" });

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
