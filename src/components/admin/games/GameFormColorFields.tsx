"use client";

import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import type { GameFormTabProps } from "@/types/admin-games";

/** Default colors used as placeholders when no custom color is set */
const COLOR_DEFAULTS = {
  background_color: "#0f172a",
  accent_color: "#8b5cf6",
  label_color: "#94a3b8",
  text_color: "#e2e8f0",
} as const;

type ColorFieldName = keyof typeof COLOR_DEFAULTS;

const COLOR_FIELDS: Array<{ name: ColorFieldName; labelKey: string }> = [
  { name: "background_color", labelKey: "backgroundColor" },
  { name: "accent_color", labelKey: "accentColor" },
  { name: "label_color", labelKey: "labelColor" },
  { name: "text_color", labelKey: "textColor" },
];

export function GameFormColorFields({ form, t }: GameFormTabProps) {
  return (
    <div className="mt-2">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        {t("colors") ?? "Couleurs de la page"}
      </h3>
      <div className="grid gap-5 sm:grid-cols-4">
        {COLOR_FIELDS.map(({ name, labelKey }) => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t(labelKey) ?? labelKey}</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={field.value || COLOR_DEFAULTS[name]}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded border border-gray-300 bg-transparent p-0.5 dark:border-gray-600"
                      aria-label={t(labelKey) ?? labelKey}
                    />
                    <Input
                      placeholder={COLOR_DEFAULTS[name]}
                      {...field}
                      value={field.value ?? ""}
                      className="font-mono text-sm"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    </div>
  );
}
