"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { Icon } from "@iconify/react";
import { EditorialSelectMenu } from "@/components/shared/EditorialSelectMenu";
import { SESSION_TYPES, type CoachPricing, type CoachGame } from "@/types/coaching";

export function CoachPricingSection() {
  const t = useTranslations("coaching.settings.pricing");
  const { data: gamesData } = useSWR<{ games: CoachGame[] }>("/api/coaching/games", fetcher);
  const {
    data: pricingData,
    isLoading,
    mutate,
  } = useSWR<{ pricing: CoachPricing[] }>("/api/coaching/pricing", fetcher);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    coachGameId: "",
    sessionType: "" as string,
    priceAmount: "",
    durationMinutes: "",
  });

  const addPricing = async () => {
    if (!form.coachGameId || !form.sessionType || !form.priceAmount) return;
    await fetch("/api/coaching/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        priceAmount: parseFloat(form.priceAmount),
        durationMinutes: parseInt(form.durationMinutes) || 60,
        priceCurrency: "EUR",
      }),
    });
    setAdding(false);
    setForm({ coachGameId: "", sessionType: "", priceAmount: "", durationMinutes: "" });
    await mutate();
  };

  const removePricing = async (id: string) => {
    await fetch(`/api/coaching/pricing/${id}`, { method: "DELETE" });
    await mutate();
  };

  if (isLoading)
    return <div className="h-40 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />;

  const games = gamesData?.games ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("description")}</p>
        <button
          onClick={() => setAdding(!adding)}
          disabled={games.length === 0}
          className="from-cta-from to-cta-to flex items-center gap-1.5 rounded-lg bg-linear-to-r px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          <Icon icon="lucide:plus" className="size-4" /> {t("addPricing")}
        </button>
      </div>

      {games.length === 0 && (
        <div className="border-editorial-line bg-editorial-2 rounded-xl border p-4 text-center text-sm text-gray-500 dark:text-gray-400">
          {t("noGamesYet")}
        </div>
      )}

      {adding && (
        <div className="border-editorial-line bg-editorial-2 space-y-3 rounded-xl border p-4">
          <EditorialSelectMenu
            fullWidth
            value={form.coachGameId}
            onChange={(v) => setForm({ ...form, coachGameId: v })}
            placeholder={t("selectGame")}
            ariaLabel={t("selectGame")}
            options={games.map((g) => ({ value: g.id, label: g.game?.title ?? g.gameId }))}
          />
          <EditorialSelectMenu
            fullWidth
            value={form.sessionType}
            onChange={(v) => setForm({ ...form, sessionType: v })}
            placeholder={t("selectType")}
            ariaLabel={t("selectType")}
            options={SESSION_TYPES.map((st) => ({ value: st, label: t(`types.${st}`) }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={form.priceAmount}
              onChange={(e) => setForm({ ...form, priceAmount: e.target.value })}
              className="border-editorial-line bg-editorial-3 placeholder:text-editorial-muted rounded-lg border p-3 text-base text-white"
              placeholder={t("pricePlaceholder")}
              min="0"
              step="0.01"
              autoComplete="off"
            />
            <input
              type="number"
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
              className="border-editorial-line bg-editorial-3 placeholder:text-editorial-muted rounded-lg border p-3 text-base text-white"
              placeholder={t("durationPlaceholder")}
              min="15"
              step="15"
              autoComplete="off"
            />
          </div>
          <button
            onClick={addPricing}
            className="from-cta-from to-cta-to w-full rounded-lg bg-linear-to-r px-4 py-2 text-sm font-medium text-white sm:w-auto"
          >
            {t("save")}
          </button>
        </div>
      )}

      {(pricingData?.pricing.length ?? 0) === 0 && games.length > 0 && !adding && (
        <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center rounded-xl border p-8 text-center">
          <Icon icon="lucide:credit-card" className="mb-3 size-10 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("empty")}</p>
        </div>
      )}

      <div className="space-y-2">
        {pricingData?.pricing.map((p) => (
          <div
            key={p.id}
            className="border-editorial-line bg-editorial-2 flex items-center justify-between rounded-xl border p-4"
          >
            <div className="flex items-center gap-3">
              {p.gameCoverImage && (
                <img
                  src={p.gameCoverImage}
                  alt=""
                  className="h-12 w-9 shrink-0 rounded-lg object-cover"
                />
              )}
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{p.gameTitle}</span>
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {t(`types.${p.sessionType}`)}
                  </span>
                  <span className="text-editorial-accent ml-2 text-lg font-bold">
                    {p.priceAmount}€
                  </span>
                  <span className="ml-1 text-xs text-gray-500">/ {p.durationMinutes}min</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => removePricing(p.id)}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
            >
              <Icon icon="lucide:trash-2" className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
