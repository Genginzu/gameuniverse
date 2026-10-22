"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { GlobalSearchCharacterItem } from "@/components/shared/GlobalSearchCharacterItem";
import { GlobalSearchGameItem } from "@/components/shared/GlobalSearchGameItem";
import { KickerLabel } from "@/components/shared/KickerLabel";
import type { CharacterSummary } from "@/types/character";
import type { GameSummary } from "@/types/game";
import type {
  GlobalSearchCharacterItem as CharacterItem,
  GlobalSearchGameItem as GameItem,
} from "@/types/global-search";
import { PreviewPlaceholder } from "./PreviewFrame";

interface SearchPreviewProps {
  games: GameSummary[];
  characters: CharacterSummary[];
}

function toGameItem(game: GameSummary): GameItem {
  return {
    id: game.id,
    slug: game.slug,
    title: game.title,
    coverUrl: game.coverImage,
    releaseYear: game.releaseYear,
    source: "local",
  };
}

function toCharacterItem(character: CharacterSummary): CharacterItem {
  return {
    id: character.id,
    slug: character.slug,
    name: character.name,
    mainImage: character.mainImage,
    role: character.role,
    primaryGame: character.primaryGame,
  };
}

/** Global search overlay excerpt fed with real games and characters. */
export function SearchPreview({ games, characters }: SearchPreviewProps) {
  const t = useTranslations("landing.previews.mockups");
  const gameItems = games.slice(0, 3).map(toGameItem);
  const characterItems = characters.slice(0, 2).map(toCharacterItem);

  if (gameItems.length === 0) {
    return <PreviewPlaceholder icon="mdi:magnify" label={t("empty")} />;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="border-editorial-line bg-editorial-3 flex min-h-11 items-center gap-3 rounded-full border px-4 text-base text-white">
        <Icon icon="mdi:magnify" className="text-editorial-muted size-5 shrink-0" aria-hidden />
        <span className="truncate">{gameItems[0].title}</span>
        <span className="bg-editorial-accent ml-[-0.5rem] h-5 w-px animate-pulse" />
      </div>

      <div className="flex flex-col gap-3">
        <KickerLabel as="span">{t("searchGames")}</KickerLabel>
        <div className="grid grid-cols-3 gap-3">
          {gameItems.map((item, index) => (
            <GlobalSearchGameItem key={item.id} item={item} isActive={index === 0} />
          ))}
        </div>
      </div>

      {characterItems.length > 0 && (
        <div className="flex flex-col gap-1">
          <KickerLabel as="span">{t("searchCharacters")}</KickerLabel>
          {characterItems.map((item) => (
            <GlobalSearchCharacterItem key={item.id} item={item} isActive={false} />
          ))}
        </div>
      )}
    </div>
  );
}
