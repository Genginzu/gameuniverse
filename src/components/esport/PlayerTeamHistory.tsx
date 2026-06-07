"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
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
      <section className="border-editorial-line bg-editorial-2 rounded-2xl border p-5 sm:p-6">
        <div className="mb-4 h-5 w-32 animate-pulse rounded bg-white/[0.06]" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.06]" />
          ))}
        </div>
      </section>
    );
  }

  if (history.length === 0) {
    return null;
  }

  return (
    <section className="border-editorial-line bg-editorial-2 rounded-2xl border p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
        <Icon icon="mdi:timeline-clock" className="text-editorial-accent h-5 w-5" />
        {t("heading")}
      </h2>

      <ol className="border-editorial-line relative ml-2 space-y-4 border-l pl-5">
        {history.map((membership) => (
          <li key={membership.id} className="relative">
            <span
              className={`bg-editorial-bg absolute -left-[27px] top-2 inline-block h-3 w-3 rounded-full ring-2 ${
                membership.isCurrent ? "bg-editorial-accent" : "bg-white/20"
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
    <div className="bg-editorial-3 hover:bg-editorial-3/70 flex items-center gap-3 rounded-xl p-3 transition-colors">
      {membership.teamImageUrl ? (
        <div className="bg-editorial-2 relative h-10 w-10 shrink-0 overflow-hidden rounded-full p-1">
          <LazyImage
            src={membership.teamImageUrl}
            alt={membership.teamName}
            fill
            className="object-contain"
            sizes="40px"
          />
        </div>
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
          <Icon icon="mdi:shield-account" className="text-editorial-muted h-5 w-5" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">
            {membership.teamName || t("unknownTeam")}
          </p>
          {membership.isCurrent && (
            <Badge className="bg-editorial-accent rounded-full px-2 py-0.5 text-[10px] font-medium text-white">
              {t("currentBadge")}
            </Badge>
          )}
        </div>
        {period && <p className="text-editorial-muted text-xs">{period}</p>}
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
