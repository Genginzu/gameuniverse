"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface MatchTeam {
  name: string;
  acronym: string | null;
  image_url: string | null;
  pandascoreId: number | null;
}

interface CalendarMatch {
  id: string;
  pandascoreId: number | null;
  name: string;
  status: string;
  beginAt: string;
  game: string;
  tournamentId: string | null;
  opponent1: MatchTeam | null;
  opponent2: MatchTeam | null;
  opponent1Score: number | null;
  opponent2Score: number | null;
  winnerId: string | null;
}

interface CalendarMatchDetailProps {
  match: CalendarMatch;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CalendarMatchDetail({ match, open, onOpenChange }: CalendarMatchDetailProps) {
  const t = useTranslations("esport.calendar");
  const { user } = useAuth();
  const [selectedWinner, setSelectedWinner] = useState<"opponent1" | "opponent2" | null>(null);
  const [amount, setAmount] = useState(10);
  const [placing, setPlacing] = useState(false);
  const [betResult, setBetResult] = useState<"success" | "error" | null>(null);

  const canBet = match.status === "not_started" && user && match.opponent1 && match.opponent2;

  const handlePlaceBet = async () => {
    if (!selectedWinner || !user) return;
    const winner = selectedWinner === "opponent1" ? match.opponent1 : match.opponent2;
    if (!winner?.pandascoreId) return;

    setPlacing(true);
    setBetResult(null);

    try {
      const res = await fetch("/api/esport/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.pandascoreId ?? match.id,
          matchName: match.name,
          game: match.game,
          predictedWinnerId: winner.pandascoreId,
          predictedWinnerName: winner.name,
          amount,
        }),
      });

      if (res.ok) {
        setBetResult("success");
      } else {
        setBetResult("error");
      }
    } catch {
      setBetResult("error");
    } finally {
      setPlacing(false);
    }
  };

  const matchDate = new Date(match.beginAt).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const matchTime = new Date(match.beginAt).toLocaleTimeString(undefined, {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="editorial-esport border-editorial-line bg-editorial-2 max-h-[90vh] w-[95vw] overflow-y-auto text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-white">{match.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Match info */}
          <div className="text-editorial-muted space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:calendar" className="size-4" />
              <span className="capitalize">{matchDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon="mdi:clock-outline" className="size-4" />
              <span>{matchTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon="mdi:gamepad-variant" className="size-4" />
              <span>{match.game}</span>
            </div>
            <Badge className={`mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
              {statusLabel}
            </Badge>
          </div>

          {/* Teams face-off */}
          <div className="bg-editorial-3 flex items-center justify-center gap-4 rounded-xl p-4">
            <TeamDisplay team={match.opponent1} score={match.opponent1Score} />
            <span className="text-editorial-muted text-lg font-bold">VS</span>
            <TeamDisplay team={match.opponent2} score={match.opponent2Score} />
          </div>

          {/* Bet section */}
          {canBet && !betResult && (
            <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <h4 className="flex items-center gap-2 text-sm font-bold text-amber-300">
                <Icon icon="mdi:dice-multiple" className="size-4" />
                {t("prediction.chooseWinner")}
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWinner("opponent1")}
                  className={`rounded-lg border-2 p-3 text-center text-sm font-medium text-white transition-all ${
                    selectedWinner === "opponent1"
                      ? "border-amber-500 bg-amber-500/20"
                      : "border-editorial-line bg-editorial-2 hover:border-amber-400/50"
                  }`}
                >
                  {match.opponent1?.acronym || match.opponent1?.name}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWinner("opponent2")}
                  className={`rounded-lg border-2 p-3 text-center text-sm font-medium text-white transition-all ${
                    selectedWinner === "opponent2"
                      ? "border-amber-500 bg-amber-500/20"
                      : "border-editorial-line bg-editorial-2 hover:border-amber-400/50"
                  }`}
                >
                  {match.opponent2?.acronym || match.opponent2?.name}
                </button>
              </div>

              {selectedWinner && (
                <div className="space-y-2">
                  <label className="text-editorial-muted text-xs font-medium">
                    {t("prediction.amount")}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="border-editorial-line bg-editorial-3 w-full rounded-lg border px-3 py-2 text-base text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent-rgb,var(--neon-primary)))]"
                  />
                  <button
                    type="button"
                    onClick={handlePlaceBet}
                    disabled={placing}
                    className="bg-editorial-accent w-full rounded-lg px-4 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  >
                    {placing ? t("prediction.placing") : t("prediction.placeBet", { amount })}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bet result */}
          {betResult === "success" && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 p-3 text-sm font-medium text-emerald-300">
              <Icon icon="mdi:check-circle" className="size-5" />
              {t("prediction.success")}
            </div>
          )}
          {betResult === "error" && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/15 p-3 text-sm font-medium text-red-300">
              <Icon icon="mdi:alert-circle" className="size-5" />
              {t("prediction.error")}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TeamDisplay({
  team,
  score,
}: {
  team: MatchTeam | null;
  score: number | null;
}) {
  if (!team) {
    return <span className="text-editorial-muted text-sm">TBD</span>;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {team.image_url ? (
        <img src={team.image_url} alt="" className="size-10 rounded-lg object-contain" />
      ) : (
        <div className="flex size-10 items-center justify-center rounded-lg bg-white/10">
          <Icon icon="mdi:account-group" className="text-editorial-muted size-5" />
        </div>
      )}
      <span className="max-w-[80px] truncate text-center text-xs font-bold text-white/90">
        {team.acronym || team.name}
      </span>
      {score !== null && <span className="text-lg font-bold text-white">{score}</span>}
    </div>
  );
}
