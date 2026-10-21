"use client";

/**
 * ProductPreviewsSection : les 6 piliers du landing en blocs alternés
 * texte + mockup live (vrais composants partagés, données publiques réelles
 * quand elles existent, données de démo sinon). Aucune capture d'écran.
 */

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { KickerLabel } from "@/components/shared/KickerLabel";
import type { HomeApiResponse } from "@/types/home";
import { CharactersPreview } from "./CharactersPreview";
import { CommunityPreview } from "./CommunityPreview";
import { LibraryPreview } from "./LibraryPreview";
import { PreviewBlock, type PreviewKey } from "./PreviewBlock";
import { ReviewsPreview } from "./ReviewsPreview";
import { SearchPreview } from "./SearchPreview";
import { TrackingPreview } from "./TrackingPreview";

interface ProductPreviewsSectionProps {
  data?: HomeApiResponse;
}

const BLOCKS: { key: PreviewKey; icon: string; exploreHref: string }[] = [
  { key: "library", icon: "mdi:bookshelf", exploreHref: "/games" },
  { key: "characters", icon: "mdi:account-star", exploreHref: "/characters" },
  { key: "community", icon: "mdi:account-group", exploreHref: "/players" },
  { key: "search", icon: "mdi:magnify", exploreHref: "/games" },
  { key: "tracking", icon: "mdi:chart-timeline-variant", exploreHref: "/trending" },
  { key: "reviews", icon: "mdi:star-shooting", exploreHref: "/games" },
];

export function ProductPreviewsSection({ data }: ProductPreviewsSectionProps) {
  const t = useTranslations("landing.previews");
  const trending = (data?.trending ?? []).filter(Boolean);
  const upcoming = (data?.upcoming ?? []).filter(Boolean);
  const showcase = trending.length > 0 ? trending : upcoming;
  const characters = data?.popularCharacters ?? [];
  const showcaseCharacters = data?.showcaseCharacters ?? [];

  const visuals: Record<PreviewKey, ReactNode> = {
    library: <LibraryPreview showcase={data?.showcaseGames ?? []} fallbackGames={showcase} />,
    characters: (
      <CharactersPreview
        characters={showcaseCharacters.length > 0 ? showcaseCharacters : characters}
      />
    ),
    community: (
      <CommunityPreview
        games={[...trending.slice(3), ...upcoming, ...trending]}
        characters={characters}
      />
    ),
    search: <SearchPreview games={showcase.slice(1)} characters={characters} />,
    tracking: <TrackingPreview games={upcoming.length > 0 ? upcoming : showcase} />,
    reviews: <ReviewsPreview reviews={data?.recentReviews ?? []} />,
  };

  return (
    <section className="w-full px-4 py-16 md:px-8 md:py-24 lg:px-10 lg:py-28">
      <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-16 md:gap-24">
        <header className="flex max-w-[720px] flex-col gap-3">
          <KickerLabel>{t("kicker")}</KickerLabel>
          <h2 className="font-display text-[clamp(2rem,5vw,3.75rem)] leading-none font-bold tracking-tight text-white">
            {t("title")}{" "}
            <span className="from-neon-secondary to-neon-primary bg-gradient-to-r bg-clip-text text-transparent">
              {t("titleAccent")}
            </span>
          </h2>
          <p className="text-editorial-muted text-base leading-relaxed">{t("description")}</p>
        </header>

        {BLOCKS.map((block, index) => (
          <PreviewBlock
            key={block.key}
            previewKey={block.key}
            index={index}
            icon={block.icon}
            exploreHref={block.exploreHref}
            reverse={index % 2 === 1}
          >
            {visuals[block.key]}
          </PreviewBlock>
        ))}
      </div>
    </section>
  );
}
