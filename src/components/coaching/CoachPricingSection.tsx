"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { Icon } from "@iconify/react";
import { SESSION_TYPES, type CoachPricing, type CoachGame, type SessionType } from "@/types/coaching";

function CustomSelect({ value, onChange, placeholder, options }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="glass-input flex w-full items-center justify-between rounded-lg p-3 text-left text-base"
      >
        <span className={selected ? "text-gray-900 dark:text-white" : "text-gray-400"}>{selected?.label || placeholder}</span>
        <Icon icon="lucide:chevron-down" className={`size-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-white/20 bg-white/80 shadow-lg backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-800/90">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors ${
                o.value === value
                  ? "bg-cyan-500/10 font-medium text-cyan-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CoachPricingSection() {
  const t = useTranslations("coaching.settings.pricing");
  const { data: gamesData } = useSWR<{ games: CoachGame[] }>("/api/coaching/games", fetcher);
  const { data: pricingData, isLoading, mutate } = useSWR<{ pricing: CoachPricing[] }>("/api/coaching/pricing", fetcher);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ coachGameId: "", sessionType: "" as string, priceAmount: "", durationMinutes: "" });

  const addPricing = async () => {
    if (!form.coachGameId || !form.sessionType || !form.priceAmount) return;
    await fetch("/api/coaching/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, priceAmount: parseFloat(form.priceAmount), durationMinutes: parseInt(form.durationMinutes) || 60, priceCurrency: "EUR" }),
    });
    setAdding(false);
    setForm({ coachGameId: "", sessionType: "", priceAmount: "", durationMinutes: "" });
    await mutate();
  };

  const removePricing = async (id: string) => {
    await fetch(`/api/coaching/pricing/${id}`, { method: "DELETE" });
    await mutate();
  };

  if (isLoading) return <div className="h-40 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />;

  const games = gamesData?.games ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("description")}</p>
        <button onClick={() => setAdding(!adding)} disabled={games.length === 0} className="flex items-center gap-1.5 rounded-lg bg-linear-to-r from-cyan-500 to-violet-500 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
          <Icon icon="lucide:plus" className="size-4" /> {t("addPricing")}
        </button>
      </div>

      {games.length === 0 && (
        <div className="glass-card rounded-xl p-4 text-center text-sm text-gray-500 dark:text-gray-400">{t("noGamesYet")}</div>
      )}

      {adding && (
        <div className="glass-card space-y-3 rounded-xl p-4">
          <CustomSelect
            value={form.coachGameId}
            onChange={(v) => setForm({ ...form, coachGameId: v })}
            placeholder={t("selectGame")}
            options={games.map((g) => ({ value: g.id, label: g.game?.title ?? g.gameId }))}
          />
          <CustomSelect
            value={form.sessionType}
            onChange={(v) => setForm({ ...form, sessionType: v as SessionType })}
            placeholder={t("selectType")}
            options={SESSION_TYPES.map((st) => ({ value: st, label: t(`types.${st}`) }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={form.priceAmount} onChange={(e) => setForm({ ...form, priceAmount: e.target.value })} className="glass-input rounded-lg p-3 text-base" placeholder={t("pricePlaceholder")} min="0" step="0.01" autoComplete="off" />
            <input type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} className="glass-input rounded-lg p-3 text-base" placeholder={t("durationPlaceholder")} min="15" step="15" autoComplete="off" />
          </div>
          <button onClick={addPricing} className="w-full rounded-lg bg-linear-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-medium text-white sm:w-auto">{t("save")}</button>
        </div>
      )}

      {(pricingData?.pricing.length ?? 0) === 0 && games.length > 0 && !adding && (
        <div className="glass-card flex flex-col items-center justify-center rounded-xl p-8 text-center">
          <Icon icon="lucide:credit-card" className="mb-3 size-10 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("empty")}</p>
        </div>
      )}

      <div className="space-y-2">
        {pricingData?.pricing.map((p) => (
          <div key={p.id} className="glass-card flex items-center justify-between rounded-xl p-4">
            <div className="flex items-center gap-3">
              {(p as any).gameCoverImage && <img src={(p as any).gameCoverImage} alt="" className="h-12 w-9 shrink-0 rounded-lg object-cover" />}
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{(p as any).gameTitle}</span>
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{t(`types.${p.sessionType}`)}</span>
                  <span className="ml-2 text-lg font-bold text-cyan-400">{p.priceAmount}€</span>
                  <span className="ml-1 text-xs text-gray-500">/ {p.durationMinutes}min</span>
                </div>
              </div>
            </div>
            <button onClick={() => removePricing(p.id)} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-500">
              <Icon icon="lucide:trash-2" className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
