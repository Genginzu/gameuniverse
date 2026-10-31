import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { WishlistEditorial } from "@/components/library/wishlist/WishlistEditorial";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

interface WishlistPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: WishlistPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "userLibrary.wishlist" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      languages: { fr: "/fr/library/wishlist", en: "/en/library/wishlist" },
    },
  };
}

export default async function WishlistPage({ params }: WishlistPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "userLibrary.errors" });

  return (
    <EditorialShell>
      <ErrorBoundary
        fallback={
          <ErrorFallback
            description={t("loadingDescription")}
            showRefresh={true}
            showHomeButton={true}
          />
        }
      >
        <WishlistEditorial locale={locale} />
      </ErrorBoundary>
    </EditorialShell>
  );
}
