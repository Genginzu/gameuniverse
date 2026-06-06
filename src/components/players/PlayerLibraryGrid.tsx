"use client";

/**
 * PlayerLibraryGrid : grille des jeux de la bibliothèque d'un joueur.
 *
 * Utilise le composant `GameCard` éditorial unique avec son overlay
 * `library` (badge status + rating + playtime). Pas de markup glass legacy.
 */

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { GameCard } from "@/components/games/GameCard";
import type { GameSummary } from "@/types/game";
import type { PlayerLibraryGame } from "@/types/player";

interface PlayerLibraryGridProps {
  games: PlayerLibraryGame[];
  locale: string;
}

/**
 * Adapte un `PlayerLibraryGame` vers la forme attendue par `GameCard`.
 * Les champs absents (developer, publisher, plateformes…) sont laissés
 * `undefined`, ce qui est géré nativement par `GameCard`.
 */
function toGameSummary(game: PlayerLibraryGame): GameSummary {
  return {
    id: game.gameId,
    slug: game.slug,
    title: game.title,
    coverImage: game.coverImage ?? undefined,
    developer: "",
    publisher: "",
    genres: [],
  };
}

export function PlayerLibraryGrid({ games, locale: _locale }: PlayerLibraryGridProps) {
  const t = useTranslations("players");

  const sortedGames = useMemo(
    () => [...games].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()),
    [games]
  );

  if (sortedGames.length === 0) {
    return (
      <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center gap-5 rounded-3xl border px-8 py-16 text-center">
        <div className="bg-editorial-accent/15 text-editorial-accent grid size-16 place-items-center rounded-full">
          <Icon icon="lucide:gamepad-2" className="h-7 w-7" />
        </div>
        <h3 className="font-display text-2xl font-bold text-white">{t("library.empty")}</h3>
        <p className="text-editorial-muted max-w-[50ch]">{t("library.emptyDescription")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 min-[475px]:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5 min-[1536px]:grid-cols-6 min-[1536px]:gap-5">
      {sortedGames.map((game, index) => (
        <GameCard
          key={game.id}
          game={toGameSummary(game)}
          priority={index < 5}
          overlay={{
            type: "library",
            status: game.status,
            rating: game.rating,
            playtimeHours: game.playTimeHours,
          }}
        />
      ))}
    </div>
  );
}
