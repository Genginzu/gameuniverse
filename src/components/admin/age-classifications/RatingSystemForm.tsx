"use client";

import { type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

import type { RatingSystemFormData } from "@/lib/validations/admin-rating-system-form";
import { Icon } from "@iconify/react";

export interface RatingSystemFormProps {
  mode: "create" | "edit";
  form: UseFormReturn<RatingSystemFormData>;
  onSubmit: (data: RatingSystemFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function RatingSystemForm({ mode, form, onSubmit, isSubmitting }: RatingSystemFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm dark:border-gray-700/40 dark:bg-gray-800/60">
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
                      placeholder="PEGI, ESRB, CERO…"
                      {...field}
                      disabled={mode === "edit"}
                      className={mode === "edit" ? "bg-gray-50 dark:bg-gray-900/50" : ""}
                      maxLength={10}
                    />
                  </FormControl>
                  <FormDescription>
                    Majuscules, chiffres et underscores uniquement (ex : PEGI, USK, ACB_AU)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nom */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Pan European Game Information" {...field} maxLength={100} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description du système de classification (optionnel)"
                      {...field}
                      value={field.value ?? ""}
                      maxLength={500}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>Optionnel — 500 caractères maximum</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Codes pays */}
            <FormField
              control={form.control}
              name="country_codes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Codes pays</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="FR, DE, ES, IT…"
                      value={(field.value ?? []).join(", ")}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const codes = raw
                          .split(",")
                          .map((c) => c.trim().toUpperCase())
                          .filter((c) => c.length > 0);
                        field.onChange(codes);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Codes ISO 3166-1 alpha-2 séparés par des virgules
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* URL du site web */}
            <FormField
              control={form.control}
              name="website_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site web</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://pegi.info"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>Optionnel — URL complète du site officiel</FormDescription>
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
