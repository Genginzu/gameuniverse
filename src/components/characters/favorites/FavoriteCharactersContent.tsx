"use client";

import { useTranslations, useLocale } from "next-intl";
import { useCharacterFavorites } from "@/hooks/useCharacterFavorites";
import { useAuth } from "@/hooks/useAuth";
import { EntityCard, type EntityCardConfig } from "@/components/shared/EntityCard";
import { GridSkeleton } from "@/components/shared/GridSkeleton";
import { characterSkeletonConfig } from "@/components/shared/EntitySkeleton";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import type { ReactNode } from "react";
import type { CharacterFavoriteSummary } from "@/types/character";

/** Grille responsive partagée entre le skeleton et le rendu final */
const GRID_CLASS =
  "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";
const favoriteCardConfig: EntityCardConfig<CharacterFavoriteSummary> = {
  aspectRatio: "3:4",
  imageField: "mainImage",
  titleField: "name",
  backgroundColorField: "backgroundColor",
  idField: "id",
  translationNamespace: "characters.card",
  badge: {
    field: "role",
    position: "top-right",
    variant: "role",
  },
  hoverOverlay: {
    enabled: true,
    showTitle: true,
    showDescription: false,
    fields: [],
  },
  actions: {},
  linkTemplate: (character, locale) => `/${locale}/characters/${character.slug}`,
  customHoverRenderer: (character, t) => (
    <>
      <h3 className="mb-2 line-clamp-2 text-lg font-bold text-white">{character.name}</h3>
      <div className="mb-3 space-y-1 text-xs">
        <div className="flex items-center text-gray-300">
          <span className="font-medium text-gray-400">{t("game")}</span>
          <span className="ml-1 font-medium text-white">{character.primaryGame}</span>
        </div>
      </div>
    </>
  ),
};

export function FavoriteCharactersContent() {
  const t = useTranslations("characters.favorites");
  const locale = useLocale();
  const { user, loading: authLoading } = useAuth();
  const { characters, loading, error } = useCharacterFavorites();

  const uniqueGames = new Set(
    characters.map((c) => c.primaryGame).filter((g): g is string => Boolean(g))
  ).size;

  return (
    <section className="w-full">
      <div className="mx-auto max-w-[1536px] px-4 pt-8 pb-16 md:px-8 md:pt-12 md:pb-20">
        {/* Hero */}
        <header className="mb-12 grid grid-cols-1 gap-4 lg:grid-cols-[5fr_7fr] lg:items-end lg:gap-12">
          <div>
            <KickerLabel>{t("editorial.kicker")}</KickerLabel>
            <h1 className="mt-2 font-display text-[clamp(2rem,4vw+1rem,3.5rem)] leading-[1.05] font-bold tracking-tight text-white">
              {t("editorial.titlePrefix")}{" "}
              <span className="text-editorial-accent">{t("editorial.titleAccent")}</span>
            </h1>
            <p className="text-editorial-muted mt-4 max-w-[60ch] text-base">
              {t("editorial.subtitle")}
            </p>
          </div>

          <div className="border-editorial-line grid grid-cols-2 gap-6 border-y py-6">
            <Stat label={t("editorial.stats.characters")} value={String(characters.length)} accent />
            <Stat label={t("editorial.stats.games")} value={String(uniqueGames)} />
          </div>
        </header>

        {/* Content */}
        {!authLoading && !user ? (
          <FavoritesAuthRequired />
        ) : loading ? (
          <GridSkeleton
            skeletonConfig={characterSkeletonConfig}
            count={8}
            gridClassName={GRID_CLASS}
          />
        ) : error ? (
          <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center gap-5 rounded-3xl border px-8 py-16 text-center">
            <div className="bg-editorial-accent/15 grid size-16 place-items-center rounded-full text-red-400">
              <Icon icon="lucide:heart-crack" className="h-7 w-7" />
            </div>
            <h3 className="font-display text-2xl font-bold text-white">{t("errorTitle")}</h3>
            <p className="text-editorial-muted max-w-[50ch]">{error}</p>
          </div>
        ) : characters.length === 0 ? (
          <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center gap-5 rounded-3xl border px-8 py-16 text-center">
            <div className="bg-editorial-accent/15 text-editorial-accent grid size-16 place-items-center rounded-full">
              <Icon icon="lucide:heart" className="h-7 w-7" />
            </div>
            <h3 className="font-display text-2xl font-bold text-white">{t("emptyTitle")}</h3>
            <p className="text-editorial-muted max-w-[50ch]">{t("emptyDescription")}</p>
            <Button asChild>
              <Link href="/characters">
                <Icon icon="lucide:sparkles" className="mr-2 h-4 w-4" />
                {t("exploreCharacters")}
              </Link>
            </Button>
          </div>
        ) : (
          <div className={GRID_CLASS}>
            {characters.map((character, index) => (
              <EntityCard
                key={character.id}
                entity={character}
                config={favoriteCardConfig}
                locale={locale}
                priority={index < 8}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div>
      <p
        className={`font-display text-3xl leading-none font-bold tracking-tight ${
          accent ? "text-editorial-accent" : "text-white"
        }`}
      >
        {value}
      </p>
      <KickerLabel className="mt-2">{label}</KickerLabel>
    </div>
  );
}

/** Carte d'auth affichée à la place du contenu quand l'utilisateur n'est pas connecté. */
function FavoritesAuthRequired() {
  const t = useTranslations("characters.favorites");

  return (
    <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center gap-5 rounded-3xl border px-8 py-16 text-center">
      <div className="bg-editorial-accent/15 text-editorial-accent grid size-16 place-items-center rounded-full">
        <Icon icon="lucide:lock" className="h-7 w-7" />
      </div>
      <h3 className="font-display text-2xl font-bold text-white">{t("authRequired.title")}</h3>
      <p className="text-editorial-muted max-w-[50ch]">{t("authRequired.description")}</p>
      <Button asChild>
        <Link href="/auth">
          <Icon icon="lucide:log-in" className="mr-2 h-4 w-4" />
          {t("authRequired.signIn")}
        </Link>
      </Button>
    </div>
  );
}
