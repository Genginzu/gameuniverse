"use client";

import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import type { GameFormTabProps } from "@/types/admin-games";
import { GamePlaytimePreview } from "./GamePlaytimePreview";
import { GameReleaseDatePreview } from "./GameReleaseDatePreview";
import { GameMetascorePreview } from "./GameMetascorePreview";
import { IgdbFieldIndicator } from "./IgdbFieldIndicator";

export function GameFormGeneralTab({ form, t, isIgdbField }: GameFormTabProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="release_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("releaseDate")}
                {isIgdbField && (
                  <IgdbFieldIndicator
                    fieldName="release_date"
                    isIgdbField={isIgdbField("release_date")}
                  />
                )}
              </FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
              <GameReleaseDatePreview form={form} t={t} />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="metascore"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Metascore
                {isIgdbField && (
                  <IgdbFieldIndicator
                    fieldName="metascore"
                    isIgdbField={isIgdbField("metascore")}
                  />
                )}
              </FormLabel>
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
              <GameMetascorePreview form={form} />
            </FormItem>
          )}
        />
      </div>

      {/* Playtime */}
      <div className="mt-2">
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t("playtime") ?? "Temps de jeu"}{" "}
          {isIgdbField && (
            <IgdbFieldIndicator fieldName="playtime" isIgdbField={isIgdbField("playtime")} />
          )}{" "}
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

        {/* Live playtime preview */}
        <GamePlaytimePreview form={form} t={t} />
      </div>
    </div>
  );
}
