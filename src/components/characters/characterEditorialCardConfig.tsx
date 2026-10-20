import type { EntityCardConfig } from "@/components/shared/EntityCard";
import type { CharacterSummary } from "@/types/character";

export const characterEditorialCardConfig: EntityCardConfig<CharacterSummary> = {
  aspectRatio: "3:4",
  imageField: "mainImage",
  titleField: "name",
  idField: "id",
  translationNamespace: "characters.card",
  badge: { field: "role", position: "top-right", variant: "role" },
  hoverOverlay: { enabled: true, showTitle: true, showDescription: false, fields: [] },
  actions: {},
  linkTemplate: (character) => `/characters/${character.slug}`,
  customHoverRenderer: (character, t) => (
    <>
      <h3 className="mb-2 line-clamp-2 text-lg font-bold text-white">{character.name}</h3>
      {character.primaryGame && (
        <div className="flex items-center text-xs text-gray-300">
          <span className="text-gray-400">{t("game")}</span>
          <span className="ml-1 font-medium text-white">{character.primaryGame}</span>
        </div>
      )}
    </>
  ),
};
