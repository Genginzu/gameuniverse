"use client";

import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { LazyImage } from "@/components/ui/lazy-image";
import { countryCodeToFlag, getGameIcon, getRoleBadgeClasses } from "@/lib/utils/esport-utils";

export interface EsportPlayerCardData {
  id: number;
  name: string;
  nationality: string | null;
  imageUrl: string | null;
  role: string | null;
  teamName: string | null;
  game: string | null;
}

/**
 * Card displayed in the esport players grid. Includes player photo with a
 * gradient halo on hover, country flag, role badge, team name and game.
 */
export function EsportPlayerCard({ player }: { player: EsportPlayerCardData }) {
  const flag = countryCodeToFlag(player.nationality);

  return (
    <Link href={`/esport/players/${player.id}`} className="block">
      <div className="glass-card group hover:shadow-palette-primary-500/20 relative flex flex-col items-center overflow-hidden rounded-2xl p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5">
        {/* subtle gradient halo on hover */}
        <div className="from-palette-secondary-500/0 to-palette-primary-500/0 group-hover:from-palette-secondary-500/10 group-hover:to-palette-primary-500/10 pointer-events-none absolute inset-0 bg-linear-to-br via-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative mb-3">
          <div className="from-palette-secondary-500 to-palette-primary-500 absolute inset-0 -m-0.5 rounded-full bg-linear-to-br opacity-60 blur-sm transition-opacity group-hover:opacity-100" />
          <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-white bg-gray-100 dark:border-gray-800 dark:bg-gray-700">
            {player.imageUrl ? (
              <LazyImage
                src={player.imageUrl}
                alt={player.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Icon icon="mdi:account" className="h-10 w-10 text-gray-400" />
              </div>
            )}
          </div>
          {flag && (
            <span
              className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-white text-base shadow-sm dark:border-gray-800 dark:bg-gray-800"
              aria-label={player.nationality ?? undefined}
            >
              {flag}
            </span>
          )}
        </div>

        <h3 className="line-clamp-1 w-full text-sm font-bold text-gray-900 dark:text-white">
          {player.name}
        </h3>

        {player.role && (
          <span
            className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadgeClasses(player.role)}`}
          >
            {player.role}
          </span>
        )}

        {player.teamName && (
          <p className="mt-2 line-clamp-1 w-full text-xs font-medium text-gray-600 dark:text-gray-300">
            {player.teamName}
          </p>
        )}

        {player.game && (
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Icon icon={getGameIcon(player.game)} className="h-3 w-3" />
            <span className="line-clamp-1">{player.game}</span>
          </p>
        )}
      </div>
    </Link>
  );
}
