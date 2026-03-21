"use client";

import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import type { CharacterGame } from "@/types/character";

interface CharacterGamesTabProps {
  games: CharacterGame[];
  locale: string;
  colors: { primary: string; secondary: string; accent: string; bg: string };
}

export function CharacterGamesTab({ games, locale, colors }: CharacterGamesTabProps) {
  const t = useTranslations();

  return (
    <div>
      <h3 className="mb-6 text-xl font-bold text-white">
        {t("characters.details.gameAppearances")}
      </h3>
      {games.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} locale={locale} colors={colors} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <Icon icon="lucide:gamepad-2" className="mx-auto mb-4 h-12 w-12 text-slate-500" />
          <p className="text-slate-400">{t("characters.details.noGames")}</p>
        </div>
      )}
    </div>
  );
}

interface GameCardProps {
  game: CharacterGame;
  locale: string;
  colors: { primary: string };
}

function GameCard({ game, locale, colors }: GameCardProps) {
  const t = useTranslations();

  return (
    <Link
      href={`/${locale}/games/${game.slug}`}
      className={`group relative overflow-hidden rounded-2xl border transition-all hover:scale-[1.02] ${
        game.isPrimary
          ? "border-2 shadow-lg shadow-violet-500/20"
          : "border-slate-700/50 hover:border-slate-600"
      }`}
      style={{ borderColor: game.isPrimary ? colors.primary : undefined }}
    >
      <div className="relative aspect-3/4">
        {game.coverImage ? (
          <LazyImage
            src={game.coverImage}
            alt={game.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="250px"
            showSkeleton={true}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-800">
            <Icon icon="lucide:gamepad-2" className="h-12 w-12 text-slate-500" />
          </div>
        )}
        {game.isPrimary && (
          <div className="absolute top-2 left-2">
            <Badge
              className="text-xs font-bold text-white shadow-lg"
              style={{ backgroundColor: colors.primary }}
            >
              {t("characters.details.primary")}
            </Badge>
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute right-0 bottom-0 left-0 p-4">
          <h4 className="text-lg font-bold text-white">{game.title}</h4>
          {game.releaseYear && (
            <p className="flex items-center gap-1 text-sm text-slate-300">
              <Icon icon="lucide:calendar" className="h-3 w-3" />
              {game.releaseYear}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
