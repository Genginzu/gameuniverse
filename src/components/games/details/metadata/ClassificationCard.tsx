"use client";

import { useTranslations } from "next-intl";
import { SpotlightCard } from "@/components/shared/SpotlightCard";
import type { GameGenre } from "@/types/game";
import type { GameDetailMetadata, GameTaxonomyTag } from "@/types/game-metadata";
import { igdbLabel, type IgdbLabelGroup } from "@/lib/utils/igdbLabels";
import { MetadataTagRow, type MetadataTag } from "./MetadataTagRow";

interface ClassificationCardProps {
  metadata: GameDetailMetadata;
  genres?: GameGenre[];
}

/** Listing filter query param of each taxonomy (see `GamesListingFilters`). */
type FilterParam = "themes" | "engines";

/** Technical sheet: genres, franchises, themes and engines, each linking to its listing. Modes and perspectives live in the "at a glance" bento. */
export function ClassificationCard({ metadata, genres = [] }: ClassificationCardProps) {
  const t = useTranslations("gameDetails.editorial.universe");
  const tLabels = useTranslations("igdbMetadata");

  const toTags = (
    tags: GameTaxonomyTag[],
    param: FilterParam,
    group?: IgdbLabelGroup
  ): MetadataTag[] =>
    tags.map((tag) => ({
      key: tag.slug,
      label: group ? igdbLabel(tLabels, group, tag.igdbId, tag.name) : tag.name,
      href: { pathname: "/games", query: { [param]: tag.slug } },
    }));

  // The games listing filters genres by translated name (see `genreGameIds`).
  const genreTags: MetadataTag[] = genres.map((genre) => ({
    key: genre.slug,
    label: genre.name,
    href: { pathname: "/games", query: { genres: genre.name } },
  }));

  const franchiseTags: MetadataTag[] = metadata.franchises.map((franchise) => ({
    key: `${franchise.kind}-${franchise.slug}`,
    label: franchise.name,
    href: `/franchises/${franchise.slug}`,
  }));

  const rows = [
    { label: t("genres"), tags: genreTags },
    { label: t("franchises"), tags: franchiseTags },
    { label: t("themes"), tags: toTags(metadata.themes, "themes", "themes") },
    { label: t("engines"), tags: toTags(metadata.gameEngines, "engines") },
  ].filter((row) => row.tags.length > 0);

  if (rows.length === 0) return null;

  return (
    <SpotlightCard className="p-5 md:p-6">
      <h3 className="font-display mb-4 text-lg">{t("sheet")}</h3>
      <dl>
        {rows.map((row) => (
          <MetadataTagRow key={row.label} label={row.label} tags={row.tags} />
        ))}
      </dl>
    </SpotlightCard>
  );
}

export function hasClassification(metadata: GameDetailMetadata, genres: GameGenre[] = []): boolean {
  return (
    genres.length +
      metadata.franchises.length +
      metadata.themes.length +
      metadata.gameEngines.length >
    0
  );
}
