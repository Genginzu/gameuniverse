"use client";

import { useFieldArray } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { WEBSITE_TYPE_IDS, websiteIcon } from "@/components/games/details/metadata/websiteIcons";
import { igdbLabel } from "@/lib/utils/igdbLabels";
import type { GameFormTabProps } from "@/types/admin-games";
import { IgdbFieldIndicator } from "../IgdbFieldIndicator";

const inputClass =
  "focus:border-primary focus:ring-primary min-h-11 w-full rounded-lg border border-gray-200 bg-white/60 px-3 text-base text-gray-900 focus:ring-1 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800/60 dark:text-white";

/** Official site, stores and community links of a game (IGDB `websites`). */
export function WebsitesEditor({ form, isIgdbField }: Pick<GameFormTabProps, "form" | "isIgdbField">) {
  const t = useTranslations("admin.games.form.metadata");
  const tLabels = useTranslations("igdbMetadata");
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "websites" });
  const errors = form.formState.errors.websites;

  return (
    <fieldset>
      <legend className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
        {t("websitesTitle")}
        <span className="font-normal text-gray-400">({fields.length})</span>
        {isIgdbField && <IgdbFieldIndicator fieldName="websites" isIgdbField={isIgdbField("websites")} />}
      </legend>
      <ul className="space-y-3">
        {fields.map((field, index) => {
          const typeId = form.watch(`websites.${index}.type_id`);
          return (
            <li
              key={field.id}
              className="grid grid-cols-1 gap-2 rounded-xl border border-gray-200/60 bg-white/40 p-3 backdrop-blur-xl md:grid-cols-[12rem_1fr_auto_auto] md:items-center dark:border-gray-700/50 dark:bg-gray-800/40"
            >
              <div className="flex items-center gap-2">
                <Icon icon={websiteIcon(typeId ?? null)} className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
                <select
                  {...form.register(`websites.${index}.type_id`, {
                    setValueAs: (value) => (value === "" || value === null ? null : Number(value)),
                  })}
                  aria-label={t("websiteType")}
                  className={inputClass}
                >
                  <option value="">{t("websiteTypeOther")}</option>
                  {WEBSITE_TYPE_IDS.map((id) => (
                    <option key={id} value={id}>
                      {igdbLabel(tLabels, "websiteTypes", id, String(id))}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="url"
                  {...form.register(`websites.${index}.url`)}
                  placeholder="https://"
                  aria-label={t("websiteUrl")}
                  className={inputClass}
                />
                {errors?.[index]?.url && (
                  <p className="text-destructive mt-1 text-sm">{errors[index]?.url?.message}</p>
                )}
              </div>
              <label className="flex min-h-11 items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <input type="checkbox" {...form.register(`websites.${index}.trusted`)} className="h-4 w-4" />
                {t("websiteTrusted")}
              </label>
              <button
                type="button"
                onClick={() => remove(index)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-red-500 transition-all duration-300 hover:bg-red-500/10"
                aria-label={t("websiteRemove")}
              >
                <Icon icon="mdi:delete-outline" className="h-5 w-5" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => append({ url: "", type_id: 1, trusted: false })}
        className="border-primary/40 text-primary hover:bg-primary/10 mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 text-sm font-medium transition-all duration-300 sm:w-auto"
      >
        <Icon icon="mdi:plus" className="h-4 w-4" aria-hidden />
        {t("websiteAdd")}
      </button>
    </fieldset>
  );
}
