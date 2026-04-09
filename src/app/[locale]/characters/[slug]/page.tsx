import { notFound } from "next/navigation";
import { CharacterDetailsContent } from "@/components/characters/details/CharacterDetailsContent";
import { CharacterService } from "@/lib/services/characterService";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { SeoBreadcrumb } from "@/components/shared/SeoBreadcrumb";
import { getTranslations } from "next-intl/server";
import { createServerClient } from "@/lib/supabase-server";

export const dynamicParams = true;

interface CharacterDetailsPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export default async function CharacterDetailsPage({ params }: CharacterDetailsPageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "characters.errors" });
  const tNav = await getTranslations({ locale, namespace: "navigation" });

  try {
    const character = await CharacterService.fetchCharacterDetails(slug, locale);

    if (!character) {
      notFound();
    }

    return (
      <DashboardLayout>
        <SeoBreadcrumb
          items={[
            { label: tNav("home"), href: "/" },
            { label: tNav("characters"), href: "/characters" },
            { label: character.name },
          ]}
        />
        <ErrorBoundary
          fallback={
            <ErrorFallback
              title={t("loadingTitle")}
              description={t("detailsLoadingDescription")}
              showBackButton={true}
              backUrl={`/${locale}/characters`}
              backLabel={t("backToCharacters")}
              locale={locale}
            />
          }
        >
          <CharacterDetailsContent character={character} locale={locale} />
        </ErrorBoundary>
      </DashboardLayout>
    );
  } catch {
    return (
      <DashboardLayout>
        <ErrorFallback
          title={t("loadingTitle")}
          description={t("unableToLoad")}
          showBackButton={true}
          backUrl={`/${locale}/characters`}
          backLabel={t("backToCharacters")}
          locale={locale}
        />
      </DashboardLayout>
    );
  }
}

export async function generateMetadata({ params }: CharacterDetailsPageProps) {
  const { locale, slug } = await params;

  return await CharacterService.generateCharacterMetadata(slug, locale);
}

export async function generateStaticParams() {
  const supabase = await createServerClient();
  const { data } = await supabase.from("characters").select("slug").limit(50);

  const characters = (data ?? []) as { slug: string }[];
  return characters.map((c) => ({ slug: c.slug }));
}
