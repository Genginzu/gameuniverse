"use client";

import { useFieldArray } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import type { GameFormTabProps } from "@/types/admin-games";
import { IgdbFieldIndicator } from "../IgdbFieldIndicator";

export interface MultiplayerPlatformOption {
  name: string;
  igdbId?: number | null;
}

interface MultiplayerEditorProps extends Pick<GameFormTabProps, "form" | "isIgdbField"> {
  platforms: MultiplayerPlatformOption[];
}

const FLAGS = [
  "online_coop",
  "offline_coop",
  "lan_coop",
  "campaign_coop",
  "splitscreen",
  "splitscreen_online",
  "drop_in",
] as const;
const MAXES = ["online_max", "online_coop_max", "offline_max", "offline_coop_max"] as const;

const EMPTY_MODE = {
  igdb_platform_id: null,
  ...Object.fromEntries(FLAGS.map((flag) => [flag, false])),
  ...Object.fromEntries(MAXES.map((max) => [max, null])),
} as never;

const toNullableNumber = (value: unknown) => (value === "" || value === null ? null : Number(value));

const inputClass =
  "focus:border-primary focus:ring-primary min-h-11 w-full rounded-lg border border-gray-200 bg-white/60 px-3 text-base text-gray-900 focus:ring-1 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800/60 dark:text-white";

/** IGDB multiplayer modes of a game, one row per platform (or all platforms). */
export function MultiplayerEditor({ form, isIgdbField, platforms }: MultiplayerEditorProps) {
  const t = useTranslations("admin.games.form.metadata");
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "multiplayer_modes" });
  const platformOptions = platforms.filter((platform) => typeof platform.igdbId === "number");

  return (
    <fieldset>
      <legend className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
        {t("multiplayerTitle")}
        <span className="font-normal text-gray-400">({fields.length})</span>
        {isIgdbField && (
          <IgdbFieldIndicator fieldName="multiplayer_modes" isIgdbField={isIgdbField("multiplayer_modes")} />
        )}
      </legend>
      <ul className="space-y-3">
        {fields.map((field, index) => (
          <li
            key={field.id}
            className="space-y-3 rounded-xl border border-gray-200/60 bg-white/40 p-3 backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/40"
          >
            <div className="flex items-center gap-2">
              <select
                {...form.register(`multiplayer_modes.${index}.igdb_platform_id`, { setValueAs: toNullableNumber })}
                aria-label={t("multiplayerPlatform")}
                className={inputClass}
              >
                <option value="">{t("multiplayerAllPlatforms")}</option>
                {platformOptions.map((platform) => (
                  <option key={platform.igdbId} value={platform.igdbId ?? ""}>
                    {platform.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => remove(index)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-red-500 transition-all duration-300 hover:bg-red-500/10"
                aria-label={t("multiplayerRemove")}
              >
                <Icon icon="mdi:delete-outline" className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-x-4 xs:grid-cols-2 lg:grid-cols-4">
              {FLAGS.map((flag) => (
                <label key={flag} className="flex min-h-11 items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <input type="checkbox" {...form.register(`multiplayer_modes.${index}.${flag}`)} className="h-4 w-4" />
                  {t(`multiplayerFlags.${flag}`)}
                </label>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 lg:grid-cols-4">
              {MAXES.map((max) => (
                <label key={max} className="text-sm text-gray-600 dark:text-gray-300">
                  {t(`multiplayerMaxes.${max}`)}
                  <input
                    type="number"
                    min={1}
                    {...form.register(`multiplayer_modes.${index}.${max}`, { setValueAs: toNullableNumber })}
                    className={`${inputClass} mt-1`}
                  />
                </label>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => append(EMPTY_MODE)}
        className="border-primary/40 text-primary hover:bg-primary/10 mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 text-sm font-medium transition-all duration-300 sm:w-auto"
      >
        <Icon icon="mdi:plus" className="h-4 w-4" aria-hidden />
        {t("multiplayerAdd")}
      </button>
    </fieldset>
  );
}
