"use client";

/**
 * Bento éditorial du profil joueur.
 *
 * Layout 3 cols desktop (1 col mobile, 2 cols tablet) avec une cellule
 * XL recent games (2x2), achievements (1x2), win rate stat (1x1),
 * latest post (1x2 wide), friends count (1x1).
 *
 * Toutes les sections sont autonomes : si la donnée n'est pas dispo,
 * un message de fallback (kicker + "—") est affiché plutôt que de
 * masquer la cellule (la grille reste équilibrée).
 */

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { SpotlightCard } from "@/components/shared/SpotlightCard";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { useAchievements } from "@/hooks/useAchievements";
import { usePlayerPosts } from "@/hooks/usePlayerPosts";
import type { PlayerDetails } from "@/types/player";

interface PlayerDetailBentoProps {
  player: PlayerDetails;
  locale: string;
  friendCount: number;
}

export function PlayerDetailBento({ player, locale, friendCount }: PlayerDetailBentoProps) {
  const t = useTranslations("players.details.editorial.bento");

  const { achievements } = useAchievements(player.id, locale);
  const unlocked = achievements.filter((a) => a.unlockedAt !== null);

  const { posts } = usePlayerPosts(player.id);
  const latestPost = posts[0] ?? null;

  const recentGames = player.library.slice(0, 4);

  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 pt-4 pb-16 lg:px-12 lg:pb-20">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent games (XL) */}
        <SpotlightCard className="p-6 md:col-span-2 lg:row-span-2 lg:p-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <KickerLabel className="mb-2">{t("recentKicker")}</KickerLabel>
              <h2 className="font-display text-3xl leading-none font-bold tracking-tight text-white">
                {t("recentTitle")}
              </h2>
            </div>
            <Link
              href={`/players/${player.id}?tab=library`}
              className="font-mono text-xs tracking-widest text-zinc-400 uppercase transition-colors hover:text-white"
            >
              {t("recentLink")} →
            </Link>
          </div>

          {recentGames.length > 0 ? (
            <ul className="m-0 list-none p-0">
              {recentGames.map((g) => (
                <li
                  key={g.id}
                  className="border-editorial-line flex items-center gap-5 border-t py-4 first:border-t-0"
                >
                  <Link
                    href={`/games/${g.slug}`}
                    className="bg-editorial-3 relative size-16 flex-shrink-0 overflow-hidden rounded-[0.875rem]"
                    aria-label={g.title}
                  >
                    {g.coverImage ? (
                      <Image src={g.coverImage} alt={g.title} fill sizes="64px" className="object-cover" />
                    ) : (
                      <Icon
                        icon="lucide:gamepad-2"
                        className="absolute inset-0 m-auto h-6 w-6 text-zinc-500"
                      />
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="font-display truncate text-lg text-white">{g.title}</p>
                    <p className="mt-1 font-mono text-xs text-white/50">
                      {g.playTimeHours > 0
                        ? `${g.playTimeHours.toFixed(0)}h · ${g.status}`
                        : g.status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-zinc-500">{t("recentEmpty")}</p>
          )}
        </SpotlightCard>

        {/* Achievements */}
        <SpotlightCard className="p-6 lg:p-8">
          <KickerLabel className="mb-2">{t("achievementsKicker")}</KickerLabel>
          <h2 className="mb-5 font-display text-3xl leading-none font-bold tracking-tight text-white">
            {t("achievementsTitle")}
          </h2>

          {unlocked.length > 0 ? (
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {unlocked.slice(0, 3).map((a) => (
                <li
                  key={a.key}
                  className="border-editorial-line flex items-center gap-3 rounded-[0.875rem] border bg-white/[0.02] p-3"
                >
                  <span className="bg-editorial-accent/20 text-editorial-accent grid size-10 flex-shrink-0 place-items-center rounded-full">
                    <Icon icon={a.icon} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display truncate text-[0.95rem] text-white">{a.name}</p>
                    <p className="text-editorial-muted mt-0.5 truncate font-mono text-[0.7rem]">
                      {a.category}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-zinc-500">{t("achievementsEmpty")}</p>
          )}
        </SpotlightCard>

        {/* Average rating (replaces win rate) */}
        <SpotlightCard className="p-6 lg:p-8">
          <KickerLabel className="mb-3">{t("winRateKicker")}</KickerLabel>
          {player.stats.averageRating !== null ? (
            <>
              <p className="text-editorial-accent font-display text-[clamp(3.5rem,6vw,5.5rem)] leading-none font-bold tracking-tight">
                {player.stats.averageRating.toFixed(1)}
                <span className="text-3xl text-zinc-500">/20</span>
              </p>
              <p className="mt-3 text-sm text-zinc-400">
                {t("winRateHelper", { count: player.stats.totalGames })}
              </p>
            </>
          ) : (
            <p className="text-zinc-500">{t("winRateNoData")}</p>
          )}
        </SpotlightCard>

        {/* Latest post (wide) */}
        <SpotlightCard className="p-6 md:col-span-2 lg:p-8">
          <KickerLabel className="mb-2">{t("postKicker")}</KickerLabel>
          {latestPost ? (
            <>
              <p className="font-display text-2xl leading-snug font-light text-white italic">
                « {truncate(latestPost.content, 240)} »
              </p>
              <p className="text-editorial-muted mt-4 font-mono text-xs">
                {formatRelative(latestPost.createdAt, t)}
              </p>
            </>
          ) : (
            <p className="text-zinc-500">{t("postEmpty")}</p>
          )}
        </SpotlightCard>

        {/* Friends count */}
        <SpotlightCard className="p-6 lg:p-8">
          <KickerLabel className="mb-3">{t("friendsKicker")}</KickerLabel>
          <p className="font-display text-5xl leading-none font-bold tracking-tight text-white">
            {friendCount}
          </p>
          <p className="mt-2 font-mono text-xs tracking-widest text-zinc-500 uppercase">
            {t("friendsHelper", { count: friendCount })}
          </p>
        </SpotlightCard>
      </div>
    </section>
  );
}

function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return text.slice(0, limit - 1).trimEnd() + "…";
}

/** Affichage relatif simple : "il y a Xh" ou "il y a Yj". Délégué à i18n. */
function formatRelative(iso: string, t: (key: string, values?: Record<string, number>) => string) {
  const now = Date.now();
  const created = new Date(iso).getTime();
  const diffMs = Math.max(0, now - created);
  const hours = Math.round(diffMs / (1000 * 60 * 60));

  if (hours < 24) {
    return t("postHours", { hours });
  }
  const days = Math.round(hours / 24);
  return t("postDays", { days });
}
