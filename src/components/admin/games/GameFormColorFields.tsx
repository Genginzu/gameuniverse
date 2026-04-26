"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Icon } from "@iconify/react";
import type { GameFormTabProps } from "@/types/admin-games";

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
  const [extracting, setExtracting] = useState(false);

  const extractFromCover = async () => {
    const coverUrl = form.getValues("cover_image_url");
    if (!coverUrl) return;
    setExtracting(true);
    try {
      const res = await fetch("/api/admin/games/extract-colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverUrl }),
      });
      if (res.ok) {
        const colors = await res.json();
        form.setValue("background_color", colors.background_color, { shouldDirty: true });
        form.setValue("accent_color", colors.accent_color, { shouldDirty: true });
        form.setValue("label_color", colors.label_color, { shouldDirty: true });
        form.setValue("text_color", colors.text_color, { shouldDirty: true });
      }
    } catch { /* best effort */ }
    setExtracting(false);
  };

  const [alternating, setAlternating] = useState(false);

  const generateAlternative = async () => {
    const coverUrl = form.getValues("cover_image_url");
    if (!coverUrl) return;
    setAlternating(true);
    try {
      const shift = 30 + Math.floor(Math.random() * 300); // 30-330° shift
      const res = await fetch("/api/admin/games/extract-colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverUrl, hueShift: shift }),
      });
      if (res.ok) {
        const colors = await res.json();
        form.setValue("background_color", colors.background_color, { shouldDirty: true });
        form.setValue("accent_color", colors.accent_color, { shouldDirty: true });
        form.setValue("label_color", colors.label_color, { shouldDirty: true });
        form.setValue("text_color", colors.text_color, { shouldDirty: true });
      }
    } catch { /* best effort */ }
    setAlternating(false);
  };

  return (
    <div className="mt-2">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t("colors") ?? "Couleurs de la page"}
        </h3>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={extractFromCover}
            disabled={extracting || !form.getValues("cover_image_url")}
            className="min-h-[44px] text-xs sm:min-h-0"
          >
            <Icon icon={extracting ? "mdi:loading" : "mdi:palette"} className={`mr-1.5 size-4 ${extracting ? "animate-spin" : ""}`} />
            {t("extractColors") ?? "Extraire de la cover"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateAlternative}
            disabled={alternating || !form.getValues("cover_image_url")}
            className="min-h-[44px] text-xs sm:min-h-0"
          >
            <Icon icon={alternating ? "mdi:loading" : "mdi:palette-swatch-variant"} className={`mr-1.5 size-4 ${alternating ? "animate-spin" : ""}`} />
            {t("alternativeColors") ?? "Palette alternative"}
          </Button>
        </div>
      </div>
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
