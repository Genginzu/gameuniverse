"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { LazyImage } from "@/components/ui/lazy-image";
import { countryCodeToFlag, getGameIcon } from "@/lib/utils/esport-utils";
import type { PlayerDetail } from "./player-detail-types";

/**
 * Hero section of the player detail page : dark editorial banner with the
 * player's photo, name, role, game, nationality and current team badge.
 */
export function PlayerHero({ player }: { player: PlayerDetail }) {
  const t = useTranslations("esport.players");
  const fullName = [player.firstName, player.lastName].filter(Boolean).join(" ");
  const flag = countryCodeToFlag(player.nationality);

  return (
    <section className="border-editorial-line bg-editorial-2 relative overflow-hidden rounded-3xl border p-6 sm:p-8">
      {/* decorative accent shapes */}
      <div className="bg-editorial-accent/10 pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-black/30 blur-3xl" />

      <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
        <PlayerAvatar player={player} flag={flag} />
        <div className="text-center sm:text-left">
          <h1 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            {player.name}
          </h1>
          {fullName && <p className="text-editorial-muted mt-1 text-base sm:text-lg">{fullName}</p>}

          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            {player.role && <HeroPill icon="mdi:account-star" label={player.role} />}
            {player.game && <HeroPill icon={getGameIcon(player.game)} label={player.game} />}
            {player.nationality && <HeroPill icon="mdi:earth" label={player.nationality} />}
          </div>

          {player.teamName && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white">
              {player.teamImageUrl && (
                <div className="relative h-5 w-5 overflow-hidden rounded-full bg-white/10">
                  <LazyImage
                    src={player.teamImageUrl}
                    alt={player.teamName}
                    fill
                    className="object-contain p-0.5"
                    sizes="20px"
                  />
                </div>
              )}
              <span className="text-editorial-muted text-xs font-medium uppercase tracking-wider">
                {t("currentTeam")}
              </span>
              <span className="font-semibold">{player.teamName}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PlayerAvatar({ player, flag }: { player: PlayerDetail; flag: string | null }) {
  return (
    <div className="relative">
      <div className="bg-editorial-accent/30 absolute inset-0 -m-1 rounded-full blur-md" />
      <div className="border-editorial-line bg-editorial-3 relative h-32 w-32 overflow-hidden rounded-full border-4 shadow-2xl sm:h-40 sm:w-40">
        {player.imageUrl ? (
          <LazyImage
            src={player.imageUrl}
            alt={player.name}
            fill
            className="object-cover"
            sizes="160px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon icon="mdi:account" className="text-editorial-muted h-20 w-20" />
          </div>
        )}
      </div>
      {flag && (
        <span
          className="border-editorial-line bg-editorial-2 absolute -right-1 -bottom-1 flex h-12 w-12 items-center justify-center rounded-full border-4 text-2xl shadow-lg"
          aria-label={player.nationality ?? undefined}
        >
          {flag}
        </span>
      )}
    </div>
  );
}

function HeroPill({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
      <Icon icon={icon} className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
