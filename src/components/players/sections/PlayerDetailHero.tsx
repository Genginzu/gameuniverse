"use client";

/**
 * Hero éditorial du profil joueur (inspiré du POC player profile).
 *
 * Layout asymétrique : avatar carré 5/12 à gauche avec status + rank
 * badge, identité 7/12 à droite (kicker level, titre display avec dernier
 * mot en accent, tagline italique, CTAs friend/message, mini stats).
 *
 * Conserve toute la logique fonctionnelle :
 *   - Bouton friend (FriendActionButton + SubscribeButton)
 *   - Status real-time (à terme : à wirer sur un canal Supabase Realtime)
 *
 * Pour l'instant on n'affiche pas de badge "in game" / "online" (pas
 * d'endpoint dispo) — la zone est prête, il suffit de plug le live status.
 */

import { LazyImage } from "@/components/ui/lazy-image";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { KickerLabel } from "@/components/shared/KickerLabel";
import type { PlayerDetails } from "@/types/player";
import type { ReactNode } from "react";

interface PlayerDetailHeroProps {
  player: PlayerDetails;
  displayName: string;
  /** Slot pour les boutons friend / subscribe / message. */
  friendActionSlot?: ReactNode;
  /** Slot pour les liens sociaux (twitter, twitch, etc.). */
  socialLinksSlot?: ReactNode;
  /** Bibliothèque accessible pour les stats playtime/rating. */
  reviewCount: number;
  friendCount: number;
}

export function PlayerDetailHero({
  player,
  displayName,
  friendActionSlot,
  socialLinksSlot,
  reviewCount,
  friendCount,
}: PlayerDetailHeroProps) {
  const t = useTranslations("players.details.editorial");

  // Le titre est splitté en mots; le dernier reçoit l'accent dégradé
  // (sauf si le titre est composé d'un seul mot, auquel cas tout l'accent).
  const titleWords = displayName.split(/\s+/).filter(Boolean);

  return (
    <section className="editorial-player-detail-hero">
      <div className="editorial-player-detail-hero-grid">
        {/* Avatar + frame */}
        <div className="editorial-player-detail-avatar">
          {player.avatarUrl ? (
            <LazyImage
              src={player.avatarUrl}
              alt={displayName}
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1024px) 460px, 100vw"
              showSkeleton={true}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[var(--editorial-bg-2)]">
              <Icon icon="lucide:user" className="h-24 w-24 text-zinc-500" />
            </div>
          )}

          {/* Rank badge */}
          {player.level > 0 && (
            <div className="editorial-player-detail-avatar-rank">
              {t("rankBadge", { level: player.level })}
            </div>
          )}
        </div>

        {/* Identité */}
        <div className="editorial-player-detail-identity">
          <KickerLabel>
            {player.level > 0 ? t("kicker", { level: player.level }) : t("kickerNoLevel")}
          </KickerLabel>

          <h1 className="editorial-player-detail-name">
            {titleWords.length === 0 ? (
              <span className="accent">{displayName}</span>
            ) : titleWords.length === 1 ? (
              <span className="accent">{titleWords[0]}</span>
            ) : (
              titleWords.map((word, i) => (
                <span key={i}>
                  {i === titleWords.length - 1 ? <span className="accent">{word}</span> : word}
                  {i < titleWords.length - 1 ? " " : ""}
                </span>
              ))
            )}
          </h1>

          <p className="editorial-player-detail-tagline">{t("bento.noTagline")}</p>

          {(friendActionSlot || socialLinksSlot) && (
            <div className="editorial-player-detail-actions">
              {friendActionSlot}
              {socialLinksSlot}
            </div>
          )}

          {/* Mini stats */}
          <div className="editorial-player-detail-stats">
            <Stat label={t("stats.games")} value={String(player.stats.totalGames)} />
            <Stat label={t("stats.playtime")} value={formatHours(player.stats.totalPlayTime)} />
            <Stat
              label={t("stats.rating")}
              value={
                player.stats.averageRating !== null ? player.stats.averageRating.toFixed(1) : "—"
              }
              accent
            />
          </div>

          {/* Counts: posts/friends */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-400">
            <span className="font-mono text-xs tracking-widest uppercase">
              {t("bento.friendsHelper", { count: friendCount })}
            </span>
            <span className="text-zinc-600">·</span>
            <span className="font-mono text-xs tracking-widest uppercase">
              {reviewCount} {t("stats.games")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className={`editorial-player-detail-stat-value${accent ? "accent" : ""}`}>{value}</p>
      <KickerLabel className="mt-1">{label}</KickerLabel>
    </div>
  );
}

/** Format hours: returns "3 218" or "247" (no decimal for >= 100, one for less). */
function formatHours(hours: number): string {
  if (hours <= 0) return "—";
  if (hours >= 100) {
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(hours);
  }
  return hours.toFixed(1);
}
