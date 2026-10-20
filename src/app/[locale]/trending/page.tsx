import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TrendingContent } from "@/components/games/TrendingContent";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { trendingListing } from "@/lib/listing/resources/games";
import { fetchListingDefault } from "@/lib/listing/server";
import type { TrendingGamesData } from "@/types/game";

export const revalidate = 300;

interface TrendingPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: TrendingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "trending" });

  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function TrendingPage({ params }: TrendingPageProps) {
  const { locale } = await params;
  const initialData = await fetchListingDefault<TrendingGamesData>(trendingListing, { locale });

  return (
    <EditorialShell>
      <TrendingContent initialData={initialData} />
    </EditorialShell>
  );
}
