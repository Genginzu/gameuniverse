"use client";

import { useLocale, useTranslations } from "next-intl";

import { characterEditorialCardConfig } from "@/components/characters/characterEditorialCardConfig";
import { EntityCard, type EntityCardConfig } from "@/components/shared/EntityCard";
import type { CharacterSummary } from "@/types/character";
import { PreviewPlaceholder } from "./PreviewFrame";

/** Landing variant: no top badge (role / species / gender label). */
const PREVIEW_CARD_CONFIG: EntityCardConfig<CharacterSummary> = {
  ...characterEditorialCardConfig,
  badge: undefined,
};

interface CharactersPreviewProps {
  characters: CharacterSummary[];
}

/** Popular characters rendered with the editorial character card. */
export function CharactersPreview({ characters }: CharactersPreviewProps) {
  const t = useTranslations("landing.previews.mockups");
  const locale = useLocale();
  const items = characters.slice(0, 4);

  if (items.length === 0) {
    return <PreviewPlaceholder icon="mdi:account-star" label={t("empty")} />;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
      {items.map((character) => (
        <EntityCard
          key={character.id}
          entity={character}
          config={PREVIEW_CARD_CONFIG}
          locale={locale}
        />
      ))}
    </div>
  );
}
