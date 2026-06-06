"use client";

import { useState } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { CalendarMatchDetail } from "@/components/esport/CalendarMatchDetail";

interface CalendarMatch {
  id: string;
  pandascoreId: number | null;
  name: string;
  status: string;
  beginAt: string;
  game: string;
  tournamentId: string | null;
  opponent1: { name: string; acronym: string | null; image_url: string | null; pandascoreId: number | null } | null;
  opponent2: { name: string; acronym: string | null; image_url: string | null; pandascoreId: number | null } | null;
  opponent1Score: number | null;
  opponent2Score: number | null;
  winnerId: string | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function EsportCalendarDayContent({ date }: { date: string }) {
  const t = useTranslations("esport.calendar");
  const [selectedMatch, setSelectedMatch] = useState<CalendarMatch | null>(null);

  // Extract month from date (YYYY-MM-DD -> YYYY-MM)
  const monthKey = date.slice(0, 7);

  const { data, isLoading } = useSWR<{ matches: CalendarMatch[] }>(
    `/api/esport/calendar?month=${monthKey}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Filter matches for this specific day
  const dayMatches = (data?.matches ?? []).filter((m) => m.beginAt.startsWith(date));

  const dateObj = new Date(date + "T00:00:00");
  const dateLabel = dateObj.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/esport/calendar"
          className="border-editorial-line bg-editorial-2 hover:bg-editorial-3 hover:border-editorial-accent/50 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border text-white transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent-rgb,var(--neon-primary)))]"
        >
          <Icon icon="mdi:arrow-left" className="size-5" />
        </Link>
        <div>
          <h1 className="font-display text-lg font-bold capitalize text-white sm:text-xl">
            {dateLabel}
          </h1>
          <p className="text-editorial-muted text-sm">
            {dayMatches.length} {t("matchCount")}
          </p>
        </div>
      </div>

      {/* Matches grid */}
      {isLoading ? (
        <DaySkeleton />
      ) : dayMatches.length === 0 ? (
        <EmptyState
          icon="mdi:calendar-blank"
          title={t("noMatches")}
          description={t("noMatchesDescription")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dayMatches.map((match) => (
            <MatchCard key={match.id} match={match} onClick={() => setSelectedMatch(match)} />
          ))}
        </div>
      )}

      {selectedMatch && (
        <CalendarMatchDetail
          match={selectedMatch}
          open={!!selectedMatch}
          onOpenChange={(open) => { if (!open) setSelectedMatch(null); }}
        />
      )}
    </div>
  );
}

function MatchCard({ match, onClick }: { match: CalendarMatch; onClick: () => void }) {
  const t = useTranslations("esport.calendar");

  const time = new Date(match.beginAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusLabel =
    match.status === "running"
      ? t("matchLive")
      : match.status === "finished"
        ? t("matchFinished")
        : t("matchUpcoming");

  const statusColor =
    match.status === "running"
      ? "bg-emerald-500/15 text-emerald-300"
      : match.status === "finished"
        ? "bg-white/10 text-editorial-muted"
        : "bg-editorial-accent/15 text-editorial-accent";

  return (
    <button type="button" onClick={onClick} className="border-editorial-line bg-editorial-2 hover:border-editorial-accent/50 w-full cursor-pointer rounded-2xl border p-4 text-left transition-all duration-300 sm:p-5">
      {/* Header: time + status + game */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:clock-outline" className="text-editorial-muted size-4" />
          <span className="text-editorial-muted text-sm font-medium">{time}</span>
        </div>
        <Badge className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
          {statusLabel}
        </Badge>
      </div>

      {/* Teams face-off */}
      <div className="flex items-center justify-center gap-3 sm:gap-4">
        <TeamDisplay team={match.opponent1} score={match.opponent1Score} />
        <span className="text-editorial-muted text-sm font-bold">VS</span>
        <TeamDisplay team={match.opponent2} score={match.opponent2Score} />
      </div>

      {/* Game badge */}
      <div className="mt-4 flex items-center justify-center">
        <span className="text-editorial-accent bg-editorial-accent/15 rounded-md px-2 py-0.5 text-xs font-medium">
          {match.game}
        </span>
      </div>
    </button>
  );
}

function TeamDisplay({
  team,
  score,
}: {
  team: { name: string; acronym: string | null; image_url: string | null } | null;
  score: number | null;
}) {
  if (!team) {
    return <span className="text-editorial-muted text-sm">TBD</span>;
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      {team.image_url ? (
        <img src={team.image_url} alt="" className="size-10 rounded-lg object-contain sm:size-12" />
      ) : (
        <div className="flex size-10 items-center justify-center rounded-lg bg-white/10 sm:size-12">
          <Icon icon="mdi:account-group" className="text-editorial-muted size-5" />
        </div>
      )}
      <span className="max-w-[80px] truncate text-center text-xs font-bold text-white/90 sm:text-sm">
        {team.acronym || team.name}
      </span>
      {score !== null && <span className="text-lg font-bold text-white">{score}</span>}
    </div>
  );
}

function DaySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border-editorial-line bg-editorial-2 rounded-2xl border p-5">
          <div className="mb-4 flex justify-between">
            <div className="h-4 w-16 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-4 w-16 animate-pulse rounded-full bg-white/[0.06]" />
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="size-12 animate-pulse rounded-lg bg-white/[0.06]" />
            <div className="h-4 w-6 animate-pulse rounded bg-white/[0.06]" />
            <div className="size-12 animate-pulse rounded-lg bg-white/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  );
}
