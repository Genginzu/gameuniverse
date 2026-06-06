"use client";

import { useTranslations, useLocale } from "next-intl";
import { useCharacterFavorites } from "@/hooks/useCharacterFavorites";
import { EntityCard, type EntityCardConfig } from "@/components/shared/EntityCard";
import { GridSkeleton } from "@/components/shared/GridSkeleton";
import { characterSkeletonConfig } from "@/components/shared/EntitySkeleton";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import type { CharacterFavoriteSummary } from "@/types/character";

/** Grille responsive partagée entre le skeleton et le rendu final */
const GRID_CLASS =
  "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

/** Conteneurs éditoriaux (fond sombre + largeur de page) */
const PAGE_WRAP = "bg-editorial-bg min-h-screen";
const INNER = "mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-12";
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
  const { characters, loading, error } = useCharacterFavorites();

  if (loading) {
    return (
      <div className={PAGE_WRAP}>
        <div className={INNER}>
          <GridSkeleton
            skeletonConfig={characterSkeletonConfig}
            count={8}
            gridClassName={GRID_CLASS}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={PAGE_WRAP}>
        <div className={INNER}>
          <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center rounded-2xl border py-12 text-center">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-red-500/15 text-red-400">
              <Icon icon="lucide:heart" className="h-8 w-8" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-white">{t("errorTitle")}</h3>
            <p className="text-editorial-muted max-w-md text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Req 3.3: empty state with link to /characters
  if (characters.length === 0) {
    return (
      <div className={PAGE_WRAP}>
        <div className={INNER}>
          <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center rounded-2xl border py-16 text-center">
            <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-[rgba(var(--neon-primary),0.12)] text-[rgb(var(--neon-primary))]">
              <Icon icon="lucide:heart" className="h-10 w-10" />
            </div>
            <h3 className="editorial-display mb-2 text-xl font-bold text-white">
              {t("emptyTitle")}
            </h3>
            <p className="text-editorial-muted mb-6 max-w-md text-sm">{t("emptyDescription")}</p>
            <Button asChild>
              <Link href="/characters">{t("exploreCharacters")}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Req 3.1: characters sorted by date added (desc) — handled by API
  // Req 3.2: grid showing image, name, role, primary game
  return (
    <div className={PAGE_WRAP}>
      <div className={INNER}>
        <header className="mb-8">
          <h1 className="editorial-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {t("title", { count: characters.length })}
          </h1>
        </header>

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
      </div>
    </div>
  );
}
