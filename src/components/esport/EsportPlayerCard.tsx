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
 * Card displayed in the esport players grid. Includes player photo with an
 * editorial accent halo on hover, country flag, role badge, team name and game.
 */
export function EsportPlayerCard({ player }: { player: EsportPlayerCardData }) {
  const flag = countryCodeToFlag(player.nationality);

  return (
    <Link href={`/esport/players/${player.id}`} className="block">
      <div className="border-editorial-line bg-editorial-2 hover:border-editorial-accent/50 group relative flex flex-col items-center overflow-hidden rounded-2xl border p-4 text-center transition-all duration-300 hover:-translate-y-1 sm:p-5">
        {/* subtle accent halo on hover */}
        <div className="bg-editorial-accent/[0.08] pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative mb-3">
          <div className="bg-editorial-accent absolute inset-0 -m-0.5 rounded-full opacity-40 blur-sm transition-opacity group-hover:opacity-70" />
          <div className="border-editorial-line bg-editorial-3 relative h-20 w-20 overflow-hidden rounded-full border-2">
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
                <Icon icon="mdi:account" className="text-editorial-muted h-10 w-10" />
              </div>
            )}
          </div>
          {flag && (
            <span
              className="border-editorial-line bg-editorial-2 absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full border-2 text-base shadow-sm"
              aria-label={player.nationality ?? undefined}
            >
              {flag}
            </span>
          )}
        </div>

        <h3 className="relative line-clamp-1 w-full text-sm font-bold text-white">
          {player.name}
        </h3>

        {player.role && (
          <span
            className={`relative mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadgeClasses(player.role)}`}
          >
            {player.role}
          </span>
        )}

        {player.teamName && (
          <p className="relative mt-2 line-clamp-1 w-full text-xs font-medium text-white/80">
            {player.teamName}
          </p>
        )}

        {player.game && (
          <p className="text-editorial-muted relative mt-1 flex items-center gap-1 text-xs">
            <Icon icon={getGameIcon(player.game)} className="h-3 w-3" />
            <span className="line-clamp-1">{player.game}</span>
          </p>
        )}
      </div>
    </Link>
  );
}
