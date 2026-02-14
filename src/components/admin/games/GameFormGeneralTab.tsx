"use client";

import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import type { GameFormTabProps } from "@/types/admin-games";
import { GameFormColorFields } from "./GameFormColorFields";

interface GeneralTabProps extends GameFormTabProps {
  mode: "create" | "edit";
}

export function GameFormGeneralTab({ form, t, mode }: GeneralTabProps) {
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
          name="release_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("releaseDate")}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="metascore"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Metascore</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0 - 100"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? "" : e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Playtime */}
      <div className="mt-2">
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t("playtime") ?? "Temps de jeu"}{" "}
          <span className="font-normal text-gray-400">({t("playtimeUnit") ?? "en heures"})</span>
        </h3>
        <div className="grid gap-5 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="playtime_hastily"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("playtimeHastily") ?? "Rapide"}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.5"
                    placeholder="ex: 8"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? "" : e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="playtime_normally"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("playtimeNormally") ?? "Normal"}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.5"
                    placeholder="ex: 25"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? "" : e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="playtime_completely"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("playtimeCompletely") ?? "Complétionniste"}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.5"
                    placeholder="ex: 60"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? "" : e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Colors */}
      <GameFormColorFields form={form} t={t} />
    </div>
  );
}
