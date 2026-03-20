"use client";

import { type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

import type { RatingFormData } from "@/lib/validations/admin-rating-form";
import type { SupportedLanguage } from "@/types/admin-languages";
import { RatingFormTranslations } from "./RatingFormTranslations";
import { Icon } from "@iconify/react";

export interface RatingFormProps {
  mode: "create" | "edit";
  form: UseFormReturn<RatingFormData>;
  onSubmit: (data: RatingFormData) => Promise<void>;
  isSubmitting: boolean;
  supportedLanguages: SupportedLanguage[];
}

export function RatingForm({
  mode,
  form,
  onSubmit,
  isSubmitting,
  supportedLanguages,
}: RatingFormProps) {
  const colorHexValue = form.watch("color_hex");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-xs dark:border-gray-700/40 dark:bg-gray-800/60">
          <div className="space-y-5">
            {/* Code */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="PEGI_3, ESRB_E…"
                      {...field}
                      disabled={mode === "edit"}
                      className={mode === "edit" ? "bg-gray-50 dark:bg-gray-900/50" : ""}
                      maxLength={10}
                    />
                  </FormControl>
                  <FormDescription>Code unique de la note (max 10 caractères)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nom d'affichage */}
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom d&apos;affichage</FormLabel>
                  <FormControl>
                    <Input placeholder="PEGI 3, Everyone…" {...field} maxLength={50} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Âge minimum */}
            <FormField
              control={form.control}
              name="minimum_age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Âge minimum</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} placeholder="0" {...field} />
                  </FormControl>
                  <FormDescription>Âge minimum requis (0 ou plus)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Couleur */}
            <FormField
              control={form.control}
              name="color_hex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Couleur</FormLabel>
                  <div className="flex items-center gap-3">
                    <FormControl>
                      <Input
                        placeholder="#FF5733"
                        {...field}
                        value={field.value ?? ""}
                        maxLength={7}
                      />
                    </FormControl>
                    {colorHexValue && /^#[0-9A-Fa-f]{6}$/.test(colorHexValue) && (
                      <span
                        className="inline-block h-8 w-8 shrink-0 rounded-full border border-gray-300 dark:border-gray-600"
                        style={{ backgroundColor: colorHexValue }}
                        aria-label={`Aperçu couleur ${colorHexValue}`}
                      />
                    )}
                  </div>
                  <FormDescription>Optionnel — format #RRGGBB</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* URL de l'icône */}
            <FormField
              control={form.control}
              name="icon_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de l&apos;icône</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/icon.png"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>Optionnel — URL complète de l&apos;icône</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Traductions */}
            <RatingFormTranslations form={form} supportedLanguages={supportedLanguages} />

            {/* Ordre de tri */}
            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordre de tri</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} placeholder="0" {...field} />
                  </FormControl>
                  <FormDescription>
                    Détermine l&apos;ordre d&apos;affichage (0 = premier)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Bouton de soumission */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="min-w-[140px] gap-2">
            {isSubmitting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Icon icon="fa:save" className="h-4 w-4"  />
                {mode === "create" ? "Créer" : "Enregistrer"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
