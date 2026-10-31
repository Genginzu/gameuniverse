"use client";

import { useTranslations } from "next-intl";

import { CharacterCard } from "@/components/characters/CharacterCard";
import type { CharacterSummary } from "@/types/character";
import { PreviewPlaceholder } from "./PreviewFrame";

interface CharactersPreviewProps {
  characters: CharacterSummary[];
}

/** Popular characters rendered with the editorial character card. */
export function CharactersPreview({ characters }: CharactersPreviewProps) {
  const t = useTranslations("landing.previews.mockups");
  const items = characters.slice(0, 4);

  if (items.length === 0) {
    return <PreviewPlaceholder icon="mdi:account-star" label={t("empty")} />;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
      {items.map((character) => (
        <CharacterCard key={character.id} character={character} />
      ))}
    </div>
  );
}
