import { notFound } from "next/navigation";
import { CharacterDetailsContent } from "@/components/characters/details/CharacterDetailsContent";
import { CharacterService } from "@/lib/services/characterService";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { DynamicAccent } from "@/components/shared/DynamicAccent";
import { paletteFromHex } from "@/lib/utils/accent-palette";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { getTranslations } from "next-intl/server";

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

  try {
    const character = await CharacterService.fetchCharacterDetails(slug, locale);

    if (!character) {
      notFound();
    }

    return (
      <EditorialShell>
        <DynamicAccent
          palette={paletteFromHex(character.backgroundColor ?? "#0077e6", "blue")}
          as="div"
        >
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
        </DynamicAccent>
      </EditorialShell>
    );
  } catch {
    return (
      <EditorialShell>
        <ErrorFallback
          title={t("loadingTitle")}
          description={t("unableToLoad")}
          showBackButton={true}
          backUrl={`/${locale}/characters`}
          backLabel={t("backToCharacters")}
          locale={locale}
        />
      </EditorialShell>
    );
  }
}

export async function generateMetadata({ params }: CharacterDetailsPageProps) {
  const { locale, slug } = await params;

  return await CharacterService.generateCharacterMetadata(slug, locale);
}

// Characters are always rendered dynamically (no-store fetch),
// so pre-rendering at build time is pointless and generates noise.
export async function generateStaticParams() {
  return [];
}
