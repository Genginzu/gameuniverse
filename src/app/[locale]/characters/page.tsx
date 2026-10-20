import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AllCharactersContent } from "@/components/characters/AllCharactersContent";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { charactersListing } from "@/lib/listing/resources/characters";
import { fetchListingDefault } from "@/lib/listing/server";
import type { CharactersApiResponse } from "@/types/character";

export const revalidate = 300;

interface AllCharactersPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AllCharactersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.characters" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: { fr: "/fr/characters", en: "/en/characters" },
    },
  };
}

export default async function AllCharactersPage({ params }: AllCharactersPageProps) {
  const { locale } = await params;
  const [initialData, tErrors] = await Promise.all([
    fetchListingDefault<CharactersApiResponse>(charactersListing, { locale }),
    getTranslations({ locale, namespace: "errors.pageLoad" }),
  ]);

  return (
    <EditorialShell>
      <ErrorBoundary
        fallback={
          <ErrorFallback
            description={tErrors("characters")}
            showRefresh={true}
            showHomeButton={true}
          />
        }
      >
        <AllCharactersContent locale={locale} initialData={initialData} />
      </ErrorBoundary>
    </EditorialShell>
  );
}
