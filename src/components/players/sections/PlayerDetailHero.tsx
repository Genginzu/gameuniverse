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
    <section className="mx-auto w-full max-w-[1600px] px-6 pt-16 pb-8 lg:px-12 lg:pt-24 lg:pb-12">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
        {/* Avatar + frame */}
        <div className="relative mx-auto aspect-square w-full max-w-[460px] overflow-hidden rounded-3xl border border-white/10 lg:mx-0">
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
            <div className="bg-editorial-2 flex h-full w-full items-center justify-center">
              <Icon icon="lucide:user" className="h-24 w-24 text-zinc-500" />
            </div>
          )}

          {/* Glow interne */}
          <span
            className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_60px_rgba(var(--accent-rgb,var(--neon-primary)),0.25)]"
            aria-hidden="true"
          />

          {/* Rank badge */}
          {player.level > 0 && (
            <div className="text-editorial-accent absolute right-4 bottom-4 z-[1] rounded-full border border-[rgb(var(--accent-rgb,var(--neon-primary)))] bg-[rgba(var(--accent-rgb,var(--neon-primary)),0.2)] px-4 py-2 font-mono text-[0.7rem] tracking-[0.18em] uppercase backdrop-blur-md">
              {t("rankBadge", { level: player.level })}
            </div>
          )}
        </div>

        {/* Identité */}
        <div className="flex flex-col justify-center">
          <KickerLabel>
            {player.level > 0 ? t("kicker", { level: player.level }) : t("kickerNoLevel")}
          </KickerLabel>

          <h1 className="mt-2 font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.92] font-bold tracking-tight break-words text-white">
            {titleWords.length === 0 ? (
              <span className={ACCENT_TEXT}>{displayName}</span>
            ) : titleWords.length === 1 ? (
              <span className={ACCENT_TEXT}>{titleWords[0]}</span>
            ) : (
              titleWords.map((word, i) => (
                <span key={i}>
                  {i === titleWords.length - 1 ? <span className={ACCENT_TEXT}>{word}</span> : word}
                  {i < titleWords.length - 1 ? " " : ""}
                </span>
              ))
            )}
          </h1>

          <p className="font-display mt-6 max-w-[56ch] text-[clamp(1.25rem,1.6vw,1.625rem)] leading-snug font-light text-white/[0.78] italic">
            {t("bento.noTagline")}
          </p>

          {(friendActionSlot || socialLinksSlot) && (
            <div className="mt-8 flex flex-wrap gap-3">
              {friendActionSlot}
              {socialLinksSlot}
            </div>
          )}

          {/* Mini stats */}
          <div className="border-editorial-line mt-10 grid grid-cols-3 gap-4 border-y py-5">
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

const ACCENT_TEXT =
  "bg-gradient-to-r from-[rgb(var(--accent-rgb,var(--neon-primary)))] to-[rgba(var(--accent-rgb,var(--neon-primary)),0.6)] bg-clip-text text-transparent";

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p
        className={`font-display text-3xl leading-none font-bold tracking-tight ${accent ? "text-editorial-accent" : "text-white"}`}
      >
        {value}
      </p>
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
