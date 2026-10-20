import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { UpcomingContent } from "@/components/games/UpcomingContent";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { upcomingListing } from "@/lib/listing/resources/games";
import { fetchListingDefault } from "@/lib/listing/server";
import type { UpcomingGamesResponse } from "@/types/game";

export const revalidate = 300;

interface UpcomingPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: UpcomingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "upcoming" });

  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function UpcomingPage({ params }: UpcomingPageProps) {
  const { locale } = await params;
  const initialData = await fetchListingDefault<UpcomingGamesResponse>(upcomingListing, {
    locale,
  });

  return (
    <EditorialShell>
      <UpcomingContent initialData={initialData} />
    </EditorialShell>
  );
}
