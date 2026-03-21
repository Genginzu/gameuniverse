"use client";

import { useTranslations, useLocale } from "next-intl";
import { useCharacterFavorites } from "@/hooks/useCharacterFavorites";
import { EntityCard, type EntityCardConfig } from "@/components/shared/EntityCard";
import { GridSkeleton } from "@/components/shared/GridSkeleton";
import { characterSkeletonConfig } from "@/components/shared/EntitySkeleton";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import Link from "next/link";
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
  const { characters, loading, error } = useCharacterFavorites();

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <GridSkeleton
          skeletonConfig={characterSkeletonConfig}
          count={8}
          gridClassName={GRID_CLASS}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-12 text-center shadow-xs dark:bg-gray-800">
          <div className="mb-4 rounded-full bg-red-100 p-4 dark:bg-red-900/30">
            <Icon icon="lucide:heart" className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
            {t("errorTitle")}
          </h3>
          <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // Req 3.3: empty state with link to /characters
  if (characters.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-xs dark:bg-gray-800">
          <div className="mb-6 rounded-full bg-gray-100 p-6 dark:bg-gray-700">
            <Icon icon="lucide:heart" className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            {t("emptyTitle")}
          </h3>
          <p className="mb-6 max-w-md text-sm text-gray-500 dark:text-gray-400">
            {t("emptyDescription")}
          </p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href={`/${locale}/characters`}>{t("exploreCharacters")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Req 3.1: characters sorted by date added (desc) — handled by API
  // Req 3.2: grid showing image, name, role, primary game
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("title", { count: characters.length })}
        </h2>
      </div>

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
  );
}
