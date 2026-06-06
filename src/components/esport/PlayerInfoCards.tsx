"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { LazyImage } from "@/components/ui/lazy-image";
import { countryCodeToFlag, getGameIcon, getRoleBadgeClasses } from "@/lib/utils/esport-utils";
import type { PlayerDetail } from "./player-detail-types";

/** "About" card with player attributes (full name, role, nationality, game). */
export function PlayerAboutCard({ player }: { player: PlayerDetail }) {
  const t = useTranslations("esport.players");
  const flag = countryCodeToFlag(player.nationality);
  const fullName = [player.firstName, player.lastName].filter(Boolean).join(" ");

  return (
    <section className="border-editorial-line bg-editorial-2 rounded-2xl border p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
        <Icon icon="mdi:information-outline" className="text-editorial-accent h-5 w-5" />
        {t("about")}
      </h2>

      <dl className="space-y-3 text-sm">
        {fullName && (
          <InfoRow icon="mdi:card-account-details" label={t("fullName")} value={fullName} />
        )}
        {player.role && (
          <InfoRow
            icon="mdi:account-star"
            label={t("role")}
            valueNode={
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadgeClasses(player.role)}`}
              >
                {player.role}
              </span>
            }
          />
        )}
        {player.nationality && (
          <InfoRow
            icon="mdi:flag"
            label={t("nationality")}
            valueNode={
              <span className="flex items-center gap-1.5">
                {flag && <span className="text-base leading-none">{flag}</span>}
                <span>{player.nationality}</span>
              </span>
            }
          />
        )}
        {player.game && (
          <InfoRow icon={getGameIcon(player.game)} label={t("game")} value={player.game} />
        )}
      </dl>
    </section>
  );
}

/** Highlighted card for the player's current team, with logo and game. */
export function PlayerTeamCard({ player }: { player: PlayerDetail }) {
  const t = useTranslations("esport.players");
  if (!player.teamName) return null;

  return (
    <section className="border-editorial-line bg-editorial-2 rounded-2xl border p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
        <Icon icon="mdi:shield-account" className="text-editorial-accent h-5 w-5" />
        {t("currentTeam")}
      </h2>

      <div className="bg-editorial-3 flex items-center gap-4 rounded-xl p-3">
        <div className="bg-editorial-2 relative h-14 w-14 shrink-0 overflow-hidden rounded-xl p-1">
          {player.teamImageUrl ? (
            <LazyImage
              src={player.teamImageUrl}
              alt={player.teamName}
              fill
              className="object-contain"
              sizes="56px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Icon icon="mdi:shield-account" className="text-editorial-muted h-8 w-8" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="font-bold text-white">{player.teamName}</p>
          {player.game && <p className="text-editorial-muted text-xs">{player.game}</p>}
        </div>
      </div>
    </section>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueNode,
}: {
  icon: string;
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-editorial-muted flex items-center gap-2">
        <Icon icon={icon} className="h-4 w-4" />
        <span>{label}</span>
      </dt>
      <dd className="text-right font-medium text-white">{valueNode ?? value}</dd>
    </div>
  );
}
