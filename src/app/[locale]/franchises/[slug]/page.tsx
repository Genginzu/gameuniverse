import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { FranchiseDetailContent } from "@/components/franchises/FranchiseDetailContent";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { fetchInternalApi } from "@/lib/listing/server";
import type { FranchiseDetail } from "@/types/franchise";

export const revalidate = 300;

interface FranchisePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

function fetchFranchise(slug: string, locale: string) {
  return fetchInternalApi<FranchiseDetail>(
    `/api/franchises/${encodeURIComponent(slug)}?locale=${locale}`,
    revalidate
  );
}

export async function generateMetadata({ params }: FranchisePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const [franchise, t] = await Promise.all([
    fetchFranchise(slug, locale),
    getTranslations({ locale, namespace: "franchises.metadata" }),
  ]);
  if (!franchise) return { title: t("title") };
  return {
    title: t("detailTitle", { name: franchise.name }),
    description: franchise.description ?? t("detailDescription", { name: franchise.name, count: franchise.games.length }),
    alternates: { languages: { fr: `/fr/franchises/${slug}`, en: `/en/franchises/${slug}` } },
    openGraph: franchise.coverImage ? { images: [franchise.coverImage] } : undefined,
  };
}

export default async function FranchisePage({ params }: FranchisePageProps) {
  const { locale, slug } = await params;
  const franchise = await fetchFranchise(slug, locale);
  if (!franchise) notFound();

  return (
    <EditorialShell>
      <FranchiseDetailContent franchise={franchise} />
    </EditorialShell>
  );
}

export async function generateStaticParams() {
  return [];
}
