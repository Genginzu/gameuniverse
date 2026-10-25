import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { FranchisesListing } from "@/components/franchises/FranchisesListing";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { franchisesListing } from "@/lib/listing/resources/franchises";
import { fetchListingDefault } from "@/lib/listing/server";
import type { FranchisesApiResponse } from "@/types/franchise";

export const revalidate = 300;

interface FranchisesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: FranchisesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "franchises.metadata" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: { languages: { fr: "/fr/franchises", en: "/en/franchises" } },
  };
}

export default async function FranchisesPage({ params }: FranchisesPageProps) {
  const { locale } = await params;
  const [initialData, t] = await Promise.all([
    fetchListingDefault<FranchisesApiResponse>(franchisesListing, { locale }),
    getTranslations({ locale, namespace: "franchises" }),
  ]);

  return (
    <EditorialShell>
      <ErrorBoundary
        fallback={<ErrorFallback description={t("loadError")} showRefresh={true} showHomeButton={true} />}
      >
        <FranchisesListing initialData={initialData} />
      </ErrorBoundary>
    </EditorialShell>
  );
}
