"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { LazyImage } from "@/components/ui/lazy-image";
import { countryCodeToFlag, getGameIcon } from "@/lib/utils/esport-utils";
import type { PlayerDetail } from "./player-detail-types";

/**
 * Hero section of the player detail page : large gradient banner with the
 * player's photo, name, role, game, nationality and current team badge.
 */
export function PlayerHero({ player }: { player: PlayerDetail }) {
  const t = useTranslations("esport.players");
  const fullName = [player.firstName, player.lastName].filter(Boolean).join(" ");
  const flag = countryCodeToFlag(player.nationality);

  return (
    <section className="from-palette-secondary-500 via-palette-secondary-600 to-palette-primary-600 relative overflow-hidden rounded-3xl bg-linear-to-br p-6 shadow-xl sm:p-8">
      {/* decorative blurred shapes */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-black/20 blur-3xl" />

      <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
        <PlayerAvatar player={player} flag={flag} />
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md sm:text-4xl lg:text-5xl">
            {player.name}
          </h1>
          {fullName && <p className="mt-1 text-base text-white/80 sm:text-lg">{fullName}</p>}

          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            {player.role && (
              <HeroPill icon="mdi:account-star" label={player.role} />
            )}
            {player.game && (
              <HeroPill icon={getGameIcon(player.game)} label={player.game} />
            )}
            {player.nationality && (
              <HeroPill icon="mdi:earth" label={player.nationality} />
            )}
          </div>

          {player.teamName && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-1.5 text-sm text-white backdrop-blur-sm">
              {player.teamImageUrl && (
                <div className="relative h-5 w-5 overflow-hidden rounded-full bg-white/20">
                  <LazyImage
                    src={player.teamImageUrl}
                    alt={player.teamName}
                    fill
                    className="object-contain p-0.5"
                    sizes="20px"
                  />
                </div>
              )}
              <span className="text-xs font-medium uppercase tracking-wider text-white/80">
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

function PlayerAvatar({
  player,
  flag,
}: {
  player: PlayerDetail;
  flag: string | null;
}) {
  return (
    <div className="relative">
      <div className="absolute inset-0 -m-1 rounded-full bg-white/40 blur-md" />
      <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white/90 bg-gray-200 shadow-2xl sm:h-40 sm:w-40 dark:bg-gray-700">
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
            <Icon icon="mdi:account" className="h-20 w-20 text-gray-400" />
          </div>
        )}
      </div>
      {flag && (
        <span
          className="absolute -right-1 -bottom-1 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-white text-2xl shadow-lg dark:border-gray-800 dark:bg-gray-800"
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
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
      <Icon icon={icon} className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
