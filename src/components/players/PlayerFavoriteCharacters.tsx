"use client";

import { useTranslations } from "next-intl";
import { usePlayerFavoriteCharacters } from "@/hooks/useCharacterFavorites";
import { EntityCard, type EntityCardConfig } from "@/components/shared/EntityCard";
import { GridSkeleton } from "@/components/shared/GridSkeleton";
import { characterSkeletonConfig } from "@/components/shared/EntitySkeleton";
import { Heart } from "lucide-react";
import Link from "next/link";
import React from "react";
import type { CharacterFavoriteSummary } from "@/types/character";

const MAX_PREVIEW_COUNT = 6;

/** Reuse the same card config as FavoriteCharactersContent */
const favoriteCardConfig: EntityCardConfig<CharacterFavoriteSummary> = {
  aspectRatio: "3:4",
  imageField: "mainImage",
  titleField: "name",
  backgroundColorField: "backgroundColor",
  idField: "id",
  translationNamespace: "characters.card",
  badge: { field: "role", position: "top-right", variant: "role" },
  hoverOverlay: {
    enabled: true,
    showTitle: true,
    showDescription: false,
    fields: [],
  },
  actions: {},
  linkTemplate: (character, locale) => `/${locale}/characters/${character.slug}`,
  customHoverRenderer: (character, t) =>
    React.createElement(
      React.Fragment,
      null,
      React.createElement(
        "h3",
        { className: "mb-2 line-clamp-2 text-lg font-bold text-white" },
        character.name
      ),
      React.createElement(
        "div",
        { className: "mb-3 space-y-1 text-xs" },
        React.createElement(
          "div",
          { className: "flex items-center text-gray-300" },
          React.createElement("span", { className: "font-medium text-gray-400" }, t("game")),
          React.createElement(
            "span",
            { className: "ml-1 font-medium text-white" },
            character.primaryGame
          )
        )
      )
    ),
};

interface PlayerFavoriteCharactersProps {
  playerId: string;
  locale: string;
}

export function PlayerFavoriteCharacters({ playerId, locale }: PlayerFavoriteCharactersProps) {
  const t = useTranslations("players.favoriteCharacters");
  const { characters, loading, error } = usePlayerFavoriteCharacters(playerId);

  // Req 4.3: empty state when no favorites
  if (!loading && !error && characters.length === 0) {
    return (
      <section className="mb-8">
        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-white">
          <Heart className="h-6 w-6 text-pink-400" />
          {t("title")}
        </h2>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-700/50 bg-slate-800/50 py-12 text-center">
          <div className="mb-4 rounded-full bg-slate-700/50 p-4">
            <Heart className="h-10 w-10 text-slate-400" />
          </div>
          <p className="text-sm text-slate-400">{t("empty")}</p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="mb-8">
        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-white">
          <Heart className="h-6 w-6 text-pink-400" />
          {t("title")}
        </h2>
        <GridSkeleton skeletonConfig={characterSkeletonConfig} count={MAX_PREVIEW_COUNT} />
      </section>
    );
  }

  // Silently hide section on error (non-critical section)
  if (error) return null;

  const previewCharacters = characters.slice(0, MAX_PREVIEW_COUNT);
  const hasMore = characters.length > MAX_PREVIEW_COUNT;

  // Req 4.1: show favorite characters section
  // Req 4.2: show "See all" link when more than MAX_PREVIEW_COUNT
  return (
    <section className="mb-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
          <Heart className="h-6 w-6 text-pink-400" />
          {t("title")}
        </h2>
        {hasMore && (
          <Link
            href={`/${locale}/players/${playerId}/favorite-characters`}
            className="text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
          >
            {t("seeAll", { count: characters.length })}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {previewCharacters.map((character, index) => (
          <EntityCard
            key={character.id}
            entity={character}
            config={favoriteCardConfig}
            locale={locale}
            priority={index < 4}
          />
        ))}
      </div>
    </section>
  );
}
