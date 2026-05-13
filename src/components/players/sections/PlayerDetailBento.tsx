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
    <section className="editorial-player-detail-bento-section">
      <div className="editorial-player-detail-bento">
        {/* Recent games (XL) */}
        <SpotlightCard className="editorial-player-detail-bento-cell editorial-player-detail-bento-cell--xl">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <KickerLabel className="mb-2">{t("recentKicker")}</KickerLabel>
              <h2 className="editorial-player-detail-bento-display editorial-player-detail-bento-display-md">
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
            <ul className="editorial-player-detail-recent-list">
              {recentGames.map((g) => (
                <li key={g.id} className="editorial-player-detail-recent-row">
                  <Link
                    href={`/games/${g.slug}`}
                    className="editorial-player-detail-recent-cover"
                    aria-label={g.title}
                  >
                    {g.coverImage ? (
                      <Image src={g.coverImage} alt={g.title} fill sizes="64px" />
                    ) : (
                      <Icon
                        icon="lucide:gamepad-2"
                        className="absolute inset-0 m-auto h-6 w-6 text-zinc-500"
                      />
                    )}
                  </Link>
                  <div className="editorial-player-detail-recent-info">
                    <p className="editorial-player-detail-recent-title">{g.title}</p>
                    <p className="editorial-player-detail-recent-meta">
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
        <SpotlightCard className="editorial-player-detail-bento-cell">
          <KickerLabel className="mb-2">{t("achievementsKicker")}</KickerLabel>
          <h2 className="editorial-player-detail-bento-display editorial-player-detail-bento-display-md mb-5">
            {t("achievementsTitle")}
          </h2>

          {unlocked.length > 0 ? (
            <ul className="editorial-player-detail-achievement-list">
              {unlocked.slice(0, 3).map((a) => (
                <li key={a.key} className="editorial-player-detail-achievement">
                  <span className="editorial-player-detail-achievement-icon">
                    <Icon icon={a.icon} className="h-5 w-5" />
                  </span>
                  <div className="editorial-player-detail-achievement-info">
                    <p className="editorial-player-detail-achievement-name">{a.name}</p>
                    <p className="editorial-player-detail-achievement-game">{a.category}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-zinc-500">{t("achievementsEmpty")}</p>
          )}
        </SpotlightCard>

        {/* Average rating (replaces win rate) */}
        <SpotlightCard className="editorial-player-detail-bento-cell">
          <KickerLabel className="mb-3">{t("winRateKicker")}</KickerLabel>
          {player.stats.averageRating !== null ? (
            <>
              <p className="editorial-player-detail-bento-display editorial-player-detail-bento-display-xl accent">
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
        <SpotlightCard className="editorial-player-detail-bento-cell editorial-player-detail-bento-cell--wide">
          <KickerLabel className="mb-2">{t("postKicker")}</KickerLabel>
          {latestPost ? (
            <>
              <p className="editorial-player-detail-post-quote">
                « {truncate(latestPost.content, 240)} »
              </p>
              <p className="editorial-player-detail-post-meta">
                {formatRelative(latestPost.createdAt, t)}
              </p>
            </>
          ) : (
            <p className="text-zinc-500">{t("postEmpty")}</p>
          )}
        </SpotlightCard>

        {/* Friends count */}
        <SpotlightCard className="editorial-player-detail-bento-cell">
          <KickerLabel className="mb-3">{t("friendsKicker")}</KickerLabel>
          <p className="editorial-player-detail-bento-display editorial-player-detail-bento-display-lg">
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
