"use client";

import { useTranslations } from "next-intl";
import { GameCard } from "@/components/games/GameCard";
import { Icon } from "@iconify/react";
import type { SimilarGame } from "@/types/game";

interface SimilarGamesSectionProps {
  similarGames: SimilarGame[];
  locale: string;
}

const MAX_SIMILAR_GAMES = 10;

/** Mappe un SimilarGame résolu vers les props attendues par GameCard */
function toGameCardProps(sg: SimilarGame) {
  if (!sg.game) return null;
  return {
    id: sg.game.id,
    slug: sg.game.slug,
    title: sg.game.title,
    coverImage: sg.game.coverImage ?? undefined,
    genres: sg.game.genres,
    developer: sg.game.developer,
    publisher: "",
    metascore: sg.game.metascore ?? undefined,
  };
}

export function SimilarGamesSection({ similarGames, locale }: SimilarGamesSectionProps) {
  const t = useTranslations("recommendations");

  // Ne garder que les jeux similaires qui existent localement
  const resolvedGames = similarGames.filter((sg) => sg.game !== null).slice(0, MAX_SIMILAR_GAMES);

  if (resolvedGames.length === 0) return null;

  return (
    <section className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="mb-6 flex items-center gap-2">
        <Icon icon="mdi:gamepad-variant-outline" className="h-6 w-6 text-palette-secondary-400" />
        <h2 className="text-2xl font-bold text-white">{t("title")}</h2>
      </div>

      <div className="xs:grid-cols-2 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {resolvedGames.map((sg) => {
          const props = toGameCardProps(sg);
          if (!props) return null;
          return <GameCard key={props.id} game={props} locale={locale} />;
        })}
      </div>
    </section>
  );
}
