"use client";

import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import type { CharacterFormTabProps } from "@/types/admin-characters";

interface GeneralTabProps extends CharacterFormTabProps {
  mode: "create" | "edit";
}

export function CharacterFormGeneralTab({ form, t, mode }: GeneralTabProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("slug")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("slugPlaceholder")}
                  {...field}
                  disabled={mode === "edit"}
                  className={mode === "edit" ? "bg-gray-50 dark:bg-gray-900/50" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="background_color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("backgroundColor")}</FormLabel>
              <div className="flex items-center gap-3">
                <FormControl>
                  <Input placeholder="#0f172a" {...field} value={field.value ?? ""} />
                </FormControl>
                {field.value && /^#[0-9a-fA-F]{6}$/.test(field.value) && (
                  <div
                    className="h-9 w-9 shrink-0 rounded-lg border border-gray-200 dark:border-gray-700"
                    style={{ backgroundColor: field.value }}
                    aria-label={`Color preview: ${field.value}`}
                  />
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
