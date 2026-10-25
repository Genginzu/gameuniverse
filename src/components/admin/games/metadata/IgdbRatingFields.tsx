"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import type { GameFormTabProps } from "@/types/admin-games";
import { IgdbFieldIndicator } from "../IgdbFieldIndicator";

/** IGDB `total_rating` (0-100) and its vote count: stored for later use, not shown publicly. */
export function IgdbRatingFields({ form, isIgdbField }: Pick<GameFormTabProps, "form" | "isIgdbField">) {
  const t = useTranslations("admin.games.form.metadata");
  const fields = [
    { name: "igdb_total_rating" as const, label: t("igdbRating"), max: 100, step: "0.01" },
    { name: "igdb_total_rating_count" as const, label: t("igdbRatingCount"), max: undefined, step: "1" },
  ];

  return (
    <fieldset>
      <legend className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
        {t("igdbRatingTitle")}
        {isIgdbField && <IgdbFieldIndicator fieldName="igdb_rating" isIgdbField={isIgdbField("igdb_rating")} />}
      </legend>
      <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">{t("igdbRatingHint")}</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {fields.map(({ name, label, max, step }) => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={max}
                    step={step}
                    className="text-base"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(event.target.value === "" ? "" : event.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    </fieldset>
  );
}
