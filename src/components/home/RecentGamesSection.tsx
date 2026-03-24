"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import useSWR from "swr";
import type { GameSummary } from "@/types/game";
import { useRef } from "react";
import { useInView } from "@/hooks/useInView";

interface GamesApiResponse {
  games: GameSummary[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function GameCard({ game, index }: { game: GameSummary; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const isVisible = useInView(ref, { threshold: 0.15 });

  return (
    <Link
      ref={ref}
      href={`/games/${game.slug}`}
      className={`group relative overflow-hidden rounded-2xl transition-all duration-500 hover:scale-[1.03] ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Cover image */}
      <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl">
        {game.coverImage ? (
          <img
            src={game.coverImage}
            alt={game.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-linear-to-br from-violet-500/20 to-cyan-500/20"
            style={{ backgroundColor: game.backgroundColor || undefined }}
          >
            <Icon icon="mdi:gamepad-variant" className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>

      {/* Hover overlay with game info */}
      <div className="absolute inset-0 flex flex-col justify-end rounded-2xl bg-linear-to-t from-black/80 via-black/30 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <h3 className="line-clamp-2 text-sm font-bold text-white">{game.title}</h3>
        {game.genres.length > 0 && (
          <p className="mt-1 text-xs text-gray-300">{game.genres.map((g) => g.name).join(", ")}</p>
        )}
      </div>

      {/* Metascore badge */}
      {game.metascore && (
        <div className="absolute top-2 right-2 rounded-lg bg-black/60 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
          {game.metascore}
        </div>
      )}
    </Link>
  );
}

function GameCardSkeleton() {
  return (
    <div className="aspect-[3/4] animate-pulse rounded-2xl bg-gray-200/50 dark:bg-slate-700/50" />
  );
}

export function RecentGamesSection() {
  const t = useTranslations("landing.recentGames");
  const locale = useLocale();

  const { data, isLoading } = useSWR<GamesApiResponse>(
    `/api/games?limit=8&locale=${locale}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const games = data?.games ?? [];

  return (
    <section className="relative px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="neon-text mb-2 text-3xl font-black text-gray-900 sm:text-4xl dark:text-white">
              {t("title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{t("subtitle")}</p>
          </div>
          <Link
            href="/games"
            className="hidden items-center gap-1 text-sm font-semibold text-violet-600 transition-colors hover:text-violet-500 sm:inline-flex dark:text-violet-400"
          >
            {t("viewAll")}
            <Icon icon="mdi:arrow-right" className="h-4 w-4" />
          </Link>
        </div>

        {/* Games grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <GameCardSkeleton key={i} />)
            : games.map((game, index) => <GameCard key={game.id} game={game} index={index} />)}
        </div>

        {/* Mobile "view all" link */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/games"
            className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 dark:text-violet-400"
          >
            {t("viewAll")}
            <Icon icon="mdi:arrow-right" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
