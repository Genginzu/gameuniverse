"use client";

import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import type { CharacterGame } from "@/types/character";

const ACCENT = "rgb(var(--accent-rgb, var(--neon-primary)))";

interface CharacterGamesTabProps {
  games: CharacterGame[];
  locale: string;
}

export function CharacterGamesTab({ games, locale }: CharacterGamesTabProps) {
  const t = useTranslations();

  return (
    <div>
      <h3 className="mb-6 text-xl font-bold text-white">
        {t("characters.details.gameAppearances")}
      </h3>
      {games.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} locale={locale} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <Icon icon="lucide:gamepad-2" className="text-editorial-muted mx-auto mb-4 h-12 w-12" />
          <p className="text-editorial-muted">{t("characters.details.noGames")}</p>
        </div>
      )}
    </div>
  );
}

function GameCard({ game, locale: _locale }: { game: CharacterGame; locale: string }) {
  const t = useTranslations();

  return (
    <Link
      href={`/games/${game.slug}`}
      className={`group relative overflow-hidden rounded-2xl border transition-transform hover:scale-[1.02] ${
        game.isPrimary ? "border-2" : "border-editorial-line hover:border-white/20"
      }`}
      style={game.isPrimary ? { borderColor: ACCENT } : undefined}
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
          <div className="bg-editorial-2 text-editorial-muted flex h-full w-full items-center justify-center">
            <Icon icon="lucide:gamepad-2" className="h-12 w-12" />
          </div>
        )}
        {game.isPrimary && (
          <div className="absolute top-2 left-2">
            <Badge
              className="text-xs font-bold text-white"
              style={{ backgroundColor: ACCENT }}
            >
              {t("characters.details.primary")}
            </Badge>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute right-0 bottom-0 left-0 p-4">
          <h4 className="text-lg font-bold text-white">{game.title}</h4>
          {game.releaseYear && (
            <p className="flex items-center gap-1 text-sm text-white/70">
              <Icon icon="lucide:calendar" className="h-3 w-3" />
              {game.releaseYear}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
