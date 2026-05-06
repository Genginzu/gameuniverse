"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterChip } from "@/components/shared/FilterChip";
import { PredictionDialog } from "@/components/esport/PredictionDialog";
import { useAuth } from "@/hooks/useAuth";

interface CalendarTournament {
  id: number;
  name: string;
  slug: string;
  beginAt: string | null;
  endAt: string | null;
  game: string;
  gameSlug: string;
  league: string;
  leagueImageUrl: string | null;
  serie: string;
  prizepool: string | null;
  tier: string;
  status: "upcoming" | "running";
}

export interface EsportCalendarData {
  tournaments: CalendarTournament[];
}

interface EsportCalendarContentProps {
  initialData?: EsportCalendarData;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const GAME_ICONS: Record<string, string> = {
  "LoL": "simple-icons:leagueoflegends",
  "League of Legends": "simple-icons:leagueoflegends",
  "Counter-Strike": "simple-icons:counterstrike",
  "CS2": "simple-icons:counterstrike",
  "Valorant": "simple-icons:valorant",
  "Dota 2": "simple-icons:dota2",
  "Overwatch": "mdi:shield-sword",
  "Call of Duty": "simple-icons:activision",
  "Rainbow 6 Siege": "simple-icons:ubisoft",
  "Rocket League": "simple-icons:epicgames",
  "StarCraft 2": "simple-icons:blizzard",
  "King of Glory": "mdi:crown",
  "Mobile Legends: Bang Bang": "mdi:cellphone-play",
};

export function EsportCalendarContent({ initialData }: EsportCalendarContentProps) {
  const t = useTranslations("esport.calendar");
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [betTournament, setBetTournament] = useState<{ id: number; name: string } | null>(null);

  const gamesUrl = "/api/esport/calendar?games_only=true";
  const calendarUrl = selectedGame
    ? `/api/esport/calendar?game=${encodeURIComponent(selectedGame)}`
    : "/api/esport/calendar";

  const fallbackCalendar = !selectedGame ? initialData : undefined;

  const { data: gamesData } = useSWR<{ games: string[] }>(gamesUrl, fetcher, {
    revalidateOnFocus: false,
  });
  const { data, isLoading } = useSWR<EsportCalendarData>(calendarUrl, fetcher, {
    fallbackData: fallbackCalendar,
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  const games = gamesData?.games ?? [];
  const tournaments = data?.tournaments ?? [];

  const handleGameFilter = useCallback(
    (game: string) => setSelectedGame((prev) => (prev === game ? null : game)),
    []
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {games.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {games.map((game) => (
              <FilterChip
                key={game}
                label={game}
                icon={GAME_ICONS[game] ? <Icon icon={GAME_ICONS[game]} className="size-3.5" /> : undefined}
                selected={selectedGame === game}
                onClick={() => handleGameFilter(game)}
              />
            ))}
          </div>
        )}

        {isLoading && tournaments.length === 0 ? (
          <CalendarSkeleton />
        ) : tournaments.length === 0 ? (
          <EmptyState
            icon="mdi:calendar-blank"
            title={t("noTournaments")}
            description={t("noTournamentsDescription")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                onBet={user ? () => setBetTournament({ id: tournament.id, name: tournament.name }) : undefined}
              />
            ))}
          </div>
        )}

        {betTournament && (
          <PredictionDialog
            open={!!betTournament}
            onOpenChange={(open) => { if (!open) setBetTournament(null); }}
            tournamentId={betTournament.id}
            tournamentName={betTournament.name}
          />
        )}
      </div>
    </div>
  );
}

function TournamentCard({ tournament, onBet }: { tournament: CalendarTournament; onBet?: () => void }) {
  const t = useTranslations("esport.calendar");

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const tierColors: Record<string, string> = {
    s: "bg-yellow-500 text-black",
    a: "bg-purple-500 text-white",
    b: "bg-blue-500 text-white",
    c: "bg-gray-500 text-white",
  };

  return (
    <div className="glass-card group rounded-2xl p-4 transition-all duration-300 hover:shadow-lg sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-bold text-gray-900 sm:text-base dark:text-white">
            {tournament.name}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {tournament.league} · {tournament.serie}
          </p>
        </div>
        {tournament.tier !== "unranked" && (
          <Badge
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold uppercase ${tierColors[tournament.tier] ?? "bg-gray-400 text-white"}`}
          >
            {t("tier")} {tournament.tier.toUpperCase()}
          </Badge>
        )}
      </div>

      <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-1.5">
          <Icon icon={GAME_ICONS[tournament.game] ?? "mdi:gamepad-variant"} className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium">{tournament.game}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Icon icon="mdi:calendar" className="h-3.5 w-3.5 shrink-0" />
          <span>
            {formatDate(tournament.beginAt)}
            {tournament.endAt && ` — ${formatDate(tournament.endAt)}`}
          </span>
        </div>
        {tournament.prizepool && (
          <div className="flex items-center gap-1.5">
            <Icon icon="mdi:cash" className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium">{tournament.prizepool}</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <Badge
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            tournament.status === "running"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          }`}
        >
          {tournament.status === "running" ? t("live") : t("upcoming")}
        </Badge>
        {onBet && (
          <button
            type="button"
            onClick={onBet}
            className="flex min-h-[44px] items-center gap-1 rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-600 transition-all hover:bg-amber-500/20 dark:text-amber-400"
          >
            <Icon icon="mdi:dice-multiple" className="size-3.5" />
            {t("bet")}
          </button>
        )}
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass-card rounded-2xl p-5">
          <Skeleton className="mb-2 h-5 w-3/4" />
          <Skeleton className="mb-4 h-3 w-1/2" />
          <Skeleton className="mb-2 h-3 w-2/3" />
          <Skeleton className="mb-2 h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
