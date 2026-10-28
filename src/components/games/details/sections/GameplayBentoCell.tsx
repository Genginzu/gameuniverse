"use client";

import { useTranslations } from "next-intl";
import { SpotlightCard } from "@/components/shared/SpotlightCard";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { igdbLabel, type IgdbLabelGroup } from "@/lib/utils/igdbLabels";
import type { GameDetailMetadata, GameTaxonomyTag } from "@/types/game-metadata";
import { BentoPillLink } from "./BentoPillLink";

interface GameplayBentoCellProps {
  metadata?: GameDetailMetadata;
}

interface TagGroup {
  key: IgdbLabelGroup;
  /** Games listing filter query param (see `GamesListingFilters`). */
  filterParam: "gameModes" | "perspectives";
  label: string;
  tags: GameTaxonomyTag[];
}

/** Wide "at a glance" cell: IGDB game modes and player perspectives as pills. */
export function GameplayBentoCell({ metadata }: GameplayBentoCellProps) {
  const t = useTranslations("gameDetails.editorial.universe");
  const tLabels = useTranslations("igdbMetadata");

  const groups: TagGroup[] = [
    {
      key: "gameModes" as const,
      filterParam: "gameModes" as const,
      label: t("gameModes"),
      tags: metadata?.gameModes ?? [],
    },
    {
      key: "playerPerspectives" as const,
      filterParam: "perspectives" as const,
      label: t("perspectives"),
      tags: metadata?.playerPerspectives ?? [],
    },
  ].filter((group) => group.tags.length > 0);

  if (groups.length === 0) return null;

  return (
    <SpotlightCard className="editorial-game-detail-bento-cell editorial-game-detail-bento-cell--wide">
      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <div key={group.key}>
            <KickerLabel className="mb-3">{group.label}</KickerLabel>
            <div className="flex flex-wrap gap-2">
              {group.tags.map((tag) => (
                <BentoPillLink
                  key={tag.slug}
                  href={{ pathname: "/games", query: { [group.filterParam]: tag.slug } }}
                >
                  {igdbLabel(tLabels, group.key, tag.igdbId, tag.name)}
                </BentoPillLink>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SpotlightCard>
  );
}
