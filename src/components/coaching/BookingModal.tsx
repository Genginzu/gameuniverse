"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@iconify/react";

interface Pricing {
  sessionType: string;
  priceAmount: number;
  priceCurrency: string;
  durationMinutes: number;
}

interface BookingModalProps {
  coachId: string;
  gameId: string;
  gameTitle: string;
  pricing: Pricing[];
  onClose: () => void;
}

export function BookingModal({ coachId, gameId, gameTitle, pricing, onClose }: BookingModalProps) {
  const t = useTranslations("coaching.booking");
  const tProfile = useTranslations("coaching.publicProfile");
  const { user } = useAuth();
  const [selected, setSelected] = useState<Pricing | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleBook = async () => {
    if (!selected || !date || !time) return;
    setLoading(true);
    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      const res = await fetch("/api/coaching/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId, gameId, scheduledAt, durationMinutes: selected.durationMinutes }),
      });
      if (res.ok) setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/20 bg-white p-6 shadow-xl dark:border-slate-700/50 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("title")}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Icon icon="lucide:x" className="size-5 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">{gameTitle}</p>

        {!user ? (
          <p className="text-sm text-gray-500">{t("loginRequired")}</p>
        ) : success ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <Icon icon="lucide:check-circle" className="size-10 text-green-500" />
            <p className="text-sm font-medium text-green-500">{t("success")}</p>
          </div>
        ) : pricing.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <Icon icon="lucide:calendar-x" className="size-10 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("noSessions")}</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{t("selectFormula")}</p>
              {pricing.map((p) => (
                <button key={p.sessionType} onClick={() => setSelected(p)} className={`w-full rounded-xl p-3 text-left transition-all ${selected?.sessionType === p.sessionType ? "bg-linear-to-r from-cyan-500/20 to-violet-500/20 ring-1 ring-cyan-400" : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{tProfile(`types.${p.sessionType}`)}</span>
                    <span className="text-sm font-bold text-cyan-400">{p.priceAmount}€</span>
                  </div>
                  <span className="text-xs text-gray-500">{p.durationMinutes} min</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">{t("date")}</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="glass-input w-full rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">{t("time")}</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="glass-input w-full rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            <button onClick={handleBook} disabled={!selected || !date || !time || loading} className="w-full rounded-xl bg-linear-to-r from-cyan-500 to-violet-500 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50">
              {loading ? t("booking") : t("bookNow")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
