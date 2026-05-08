"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { LazyImage } from "@/components/ui/lazy-image";
import { Badge } from "@/components/ui/badge";
import type { PlayerTeamMembership } from "@/lib/services/esportPlayerHistoryService";

interface PlayerTeamHistoryProps {
  history: PlayerTeamMembership[];
  isLoading: boolean;
}

/**
 * Vertical timeline of past and current teams for a player. Renders nothing
 * when no history is available (e.g. before the migration is applied or
 * before the backfill sync has run).
 */
export function PlayerTeamHistory({ history, isLoading }: PlayerTeamHistoryProps) {
  const t = useTranslations("esport.players.teamHistory");

  if (isLoading) {
    return (
      <section className="glass-card rounded-2xl p-5 sm:p-6">
        <Skeleton className="mb-4 h-5 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (history.length === 0) {
    return null;
  }

  return (
    <section className="glass-card rounded-2xl p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
        <Icon icon="mdi:timeline-clock" className="text-palette-primary-500 h-5 w-5" />
        {t("heading")}
      </h2>

      <ol className="relative ml-2 space-y-4 border-l border-gray-200 pl-5 dark:border-gray-700">
        {history.map((membership) => (
          <li key={membership.id} className="relative">
            <span
              className={`absolute -left-[27px] top-2 inline-block h-3 w-3 rounded-full ring-2 ring-white dark:ring-gray-900 ${
                membership.isCurrent
                  ? "from-palette-secondary-500 to-palette-primary-500 bg-linear-to-r"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
              aria-hidden
            />
            <MembershipRow membership={membership} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function MembershipRow({ membership }: { membership: PlayerTeamMembership }) {
  const t = useTranslations("esport.players.teamHistory");
  const period = formatPeriod(membership.startedAt, membership.endedAt);

  const inner = (
    <div className="flex items-center gap-3 rounded-xl bg-white/60 p-3 transition-colors hover:bg-white/80 dark:bg-gray-800/40 dark:hover:bg-gray-800/60">
      {membership.teamImageUrl ? (
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white p-1 dark:bg-gray-700">
          <LazyImage
            src={membership.teamImageUrl}
            alt={membership.teamName}
            fill
            className="object-contain"
            sizes="40px"
          />
        </div>
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
          <Icon icon="mdi:shield-account" className="h-5 w-5 text-gray-400" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {membership.teamName || t("unknownTeam")}
          </p>
          {membership.isCurrent && (
            <Badge className="from-palette-secondary-500 to-palette-primary-500 rounded-full bg-linear-to-r px-2 py-0.5 text-[10px] font-medium text-white">
              {t("currentBadge")}
            </Badge>
          )}
        </div>
        {period && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{period}</p>
        )}
      </div>
    </div>
  );

  if (membership.teamId !== null) {
    return (
      <Link href={`/esport/teams/${membership.teamId}`} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

function formatPeriod(startedAt: string, endedAt: string | null): string | null {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: "short", year: "numeric" });
  const start = fmt(startedAt);
  if (!endedAt) return `${start} – …`;
  return `${start} – ${fmt(endedAt)}`;
}
