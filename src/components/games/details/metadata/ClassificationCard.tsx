"use client";

import { useTranslations } from "next-intl";
import { SpotlightCard } from "@/components/shared/SpotlightCard";
import type { GameDetailMetadata, GameTaxonomyTag } from "@/types/game-metadata";
import { igdbLabel, type IgdbLabelGroup } from "@/lib/utils/igdbLabels";
import { MetadataTagRow, type MetadataTag } from "./MetadataTagRow";

interface ClassificationCardProps {
  metadata: GameDetailMetadata;
}

/** Listing filter query param of each taxonomy (see `GamesListingFilters`). */
type FilterParam = "themes" | "gameModes" | "perspectives" | "engines";

/** Technical sheet: themes, modes, perspectives, engines and franchises, each linking to its listing. */
export function ClassificationCard({ metadata }: ClassificationCardProps) {
  const t = useTranslations("gameDetails.editorial.universe");
  const tLabels = useTranslations("igdbMetadata");

  const toTags = (tags: GameTaxonomyTag[], param: FilterParam, group?: IgdbLabelGroup): MetadataTag[] =>
    tags.map((tag) => ({
      key: tag.slug,
      label: group ? igdbLabel(tLabels, group, tag.igdbId, tag.name) : tag.name,
      href: { pathname: "/games", query: { [param]: tag.slug } },
    }));

  const franchiseTags: MetadataTag[] = metadata.franchises.map((franchise) => ({
    key: `${franchise.kind}-${franchise.slug}`,
    label: franchise.name,
    href: `/franchises/${franchise.slug}`,
  }));

  const rows = [
    { label: t("franchises"), tags: franchiseTags },
    { label: t("themes"), tags: toTags(metadata.themes, "themes", "themes") },
    { label: t("gameModes"), tags: toTags(metadata.gameModes, "gameModes", "gameModes") },
    {
      label: t("perspectives"),
      tags: toTags(metadata.playerPerspectives, "perspectives", "playerPerspectives"),
    },
    { label: t("engines"), tags: toTags(metadata.gameEngines, "engines") },
  ].filter((row) => row.tags.length > 0);

  if (rows.length === 0) return null;

  return (
    <SpotlightCard className="p-5 md:p-6">
      <h3 className="mb-4 font-display text-lg">{t("sheet")}</h3>
      <dl>
        {rows.map((row) => (
          <MetadataTagRow key={row.label} label={row.label} tags={row.tags} />
        ))}
      </dl>
    </SpotlightCard>
  );
}

export function hasClassification(metadata: GameDetailMetadata): boolean {
  return (
    metadata.franchises.length +
      metadata.themes.length +
      metadata.gameModes.length +
      metadata.playerPerspectives.length +
      metadata.gameEngines.length >
    0
  );
}
