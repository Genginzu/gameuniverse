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

function shiftHue(hex: string, degrees: number): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return hex;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  h = (h + degrees / 360) % 1;
  if (h < 0) h += 1;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (pp: number, qq: number, t: number) => {
    let tt = t; if (tt < 0) tt += 1; if (tt > 1) tt -= 1;
    if (tt < 1/6) return pp + (qq - pp) * 6 * tt;
    if (tt < 1/2) return qq;
    if (tt < 2/3) return pp + (qq - pp) * (2/3 - tt) * 6;
    return pp;
  };
  const toHex = (v: number) => Math.round(Math.max(0, Math.min(255, v * 255))).toString(16).padStart(2, "0");
  return `#${toHex(hue2rgb(p, q, h + 1/3))}${toHex(hue2rgb(p, q, h))}${toHex(hue2rgb(p, q, h - 1/3))}`;
}

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

  const generateAlternative = () => {
    const shift = 30 + Math.floor(Math.random() * 60); // 30-90° shift
    for (const { name } of COLOR_FIELDS) {
      const current = form.getValues(name) || COLOR_DEFAULTS[name];
      form.setValue(name, shiftHue(current, shift), { shouldDirty: true });
    }
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
            className="min-h-[44px] text-xs sm:min-h-0"
          >
            <Icon icon="mdi:palette-swatch-variant" className="mr-1.5 size-4" />
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
