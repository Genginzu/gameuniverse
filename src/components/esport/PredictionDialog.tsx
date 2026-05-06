"use client";

import { useState } from "react";
import useSWR from "swr";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { Skeleton } from "@/components/ui/skeleton";

interface Opponent {
  id: number;
  name: string;
  imageUrl: string | null;
}

interface Match {
  id: number;
  name: string;
  status: string;
  beginAt: string | null;
  game: string;
  opponents: Opponent[];
}

interface PredictionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: number;
  tournamentName: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function PredictionDialog({ open, onOpenChange, tournamentId, tournamentName }: PredictionDialogProps) {
  const t = useTranslations("esport.calendar.prediction");
  const { wallet, mutate: mutateWallet } = useWallet();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<Opponent | null>(null);
  const [amount, setAmount] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { data, isLoading } = useSWR<{ matches: Match[] }>(
    open ? `/api/esport/tournaments/${tournamentId}/matches` : null,
    fetcher
  );

  const matches = data?.matches ?? [];

  const handleSubmit = async () => {
    if (!selectedMatch || !selectedWinner || amount < 1) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/esport/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          matchName: selectedMatch.name,
          game: selectedMatch.game,
          predictedWinnerId: selectedWinner.id,
          predictedWinnerName: selectedWinner.name,
          amount,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || t("error"));
        return;
      }

      setSuccess(true);
      await mutateWallet();
      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 1500);
    } catch {
      setError(t("error"));
    } finally {
      setSubmitting(false);
    }
  };

  const resetState = () => {
    setSelectedMatch(null);
    setSelectedWinner(null);
    setAmount(10);
    setError("");
    setSuccess(false);
  };

  const balance = wallet?.balance ?? 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState(); }}>
      <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="mdi:dice-multiple" className="size-5 text-amber-500" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>{tournamentName}</DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <Icon icon="mdi:check-circle" className="size-12 text-green-500" />
            <p className="font-medium text-green-700 dark:text-green-400">{t("success")}</p>
          </div>
        ) : !selectedMatch ? (
          /* Step 1: Match selection */
          isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : matches.length === 0 ? (
            <div className="py-8 text-center">
              <Icon icon="mdi:calendar-blank" className="mx-auto mb-2 size-10 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("noMatches")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("selectMatch")}</p>
              {matches.map((match) => (
                <button
                  key={match.id}
                  type="button"
                  onClick={() => setSelectedMatch(match)}
                  className="flex w-full items-center justify-between rounded-xl border border-white/20 bg-white/40 p-3 text-left transition-all hover:bg-white/60 dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:bg-slate-700/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {match.opponents[0].name} vs {match.opponents[1].name}
                    </p>
                    {match.beginAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(match.beginAt).toLocaleDateString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                  <Icon icon="mdi:chevron-right" className="size-5 shrink-0 text-gray-400" />
                </button>
              ))}
            </div>
          )
        ) : (
          /* Step 2: Choose winner + amount */
          <div className="space-y-4">
            <button type="button" onClick={() => { setSelectedMatch(null); setSelectedWinner(null); }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <Icon icon="mdi:arrow-left" className="size-4" />
              {t("back")}
            </button>

            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("chooseWinner")}</p>
            <div className="grid grid-cols-2 gap-3">
              {selectedMatch.opponents.map((opp) => (
                <button
                  key={opp.id}
                  type="button"
                  onClick={() => setSelectedWinner(opp)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                    selectedWinner?.id === opp.id
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-white/20 bg-white/30 hover:border-amber-300 dark:border-slate-700/50 dark:bg-slate-800/40"
                  }`}
                >
                  {opp.imageUrl ? (
                    <img src={opp.imageUrl} alt={opp.name} className="size-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                      <Icon icon="mdi:account-group" className="size-5 text-gray-500" />
                    </div>
                  )}
                  <span className="text-center text-xs font-medium text-gray-900 dark:text-white">{opp.name}</span>
                </button>
              ))}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("amount")} <span className="text-xs text-gray-400">({t("balanceLabel")}: {balance})</span>
              </label>
              <input
                type="number"
                min={1}
                max={balance}
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="glass-input w-full rounded-lg px-3 py-2 text-base text-gray-900 dark:text-white"
              />
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <Button
              onClick={handleSubmit}
              disabled={!selectedWinner || amount < 1 || amount > balance || submitting}
              className="w-full bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 text-white"
            >
              {submitting ? t("placing") : t("placeBet", { amount })}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
