"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { useTranslationAiSettings } from "@/hooks/useTranslationAiSettings";
import type { TranslationModelOption } from "@/types/admin-translations";
import { TranslationCreditsCard } from "./TranslationCreditsCard";

/** Groups gateway models by provider (the part of the id before "/"). */
function groupByProvider(models: TranslationModelOption[]): [string, TranslationModelOption[]][] {
  const groups = new Map<string, TranslationModelOption[]>();
  for (const model of models) {
    const provider = model.id.split("/")[0];
    groups.set(provider, [...(groups.get(provider) ?? []), model]);
  }
  return [...groups.entries()];
}

/** Model picker and AI Gateway credits, shown above the global progress bar. */
export function TranslationAiSettingsPanel() {
  const t = useTranslations("admin.translations.ai");
  const locale = useLocale();
  const { settings, isLoading, isSaving, isRefreshing, saveError, updateModel, refresh } =
    useTranslationAiSettings();

  const groups = useMemo(() => groupByProvider(settings?.models ?? []), [settings?.models]);
  const price = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 3 }),
    [locale]
  );
  const money = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }),
    [locale]
  );
  const current = settings?.models.find((m) => m.id === settings.model);
  const hasModels = groups.length > 0;

  const priceLabel = (model: TranslationModelOption) =>
    model.inputPricePerMillion === null || model.outputPricePerMillion === null
      ? ""
      : ` — ${t("pricePerMillion", {
          input: price.format(model.inputPricePerMillion),
          output: price.format(model.outputPricePerMillion),
        })}`;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="glass-card rounded-2xl p-4 transition-all duration-300 md:col-span-2 md:p-6">
        <label
          htmlFor="translation-model"
          className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <Icon icon="mdi:robot-outline" className="size-4" />
          {t("modelLabel")}
          {isSaving && <Icon icon="mdi:loading" className="size-4 animate-spin" />}
        </label>
        <select
          id="translation-model"
          value={settings?.model ?? ""}
          onChange={(e) => updateModel(e.target.value)}
          disabled={isLoading || isSaving || !hasModels}
          className="glass-input min-h-[44px] w-full rounded-lg px-3 py-2 text-base disabled:opacity-50 sm:text-sm"
        >
          {!hasModels && settings && <option value={settings.model}>{settings.model}</option>}
          {groups.map(([provider, models]) => (
            <optgroup key={provider} label={provider}>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                  {priceLabel(model)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {saveError
            ? t("saveError", { error: saveError })
            : !isLoading && !hasModels
              ? t("modelsUnavailable")
              : t("modelHint", { model: current?.id ?? settings?.model ?? "" })}
        </p>
      </div>

      <TranslationCreditsCard
        credits={settings?.credits ?? null}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        format={(value) => money.format(value)}
        onRefresh={refresh}
      />
    </div>
  );
}
