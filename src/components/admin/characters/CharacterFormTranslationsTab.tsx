"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { SUPPORTED_LANGUAGES, type CharacterFormTabProps } from "@/types/admin-characters";

export function CharacterFormTranslationsTab({ form, t }: CharacterFormTabProps) {
  return (
    <div className="space-y-4">
      {SUPPORTED_LANGUAGES.map((lang) => {
        const index = form.watch("translations").findIndex((tr) => tr.language_code === lang.code);
        if (index === -1) return null;
        return (
          <div
            key={lang.code}
            className="rounded-xl border border-gray-100 bg-gray-50/60 p-5 dark:border-gray-700/30 dark:bg-gray-900/20"
          >
            <div className="mb-4">
              <span className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <span className="text-xl">{lang.flag}</span>
                {lang.label}
              </span>
            </div>
            <input type="hidden" {...form.register(`translations.${index}.language_code`)} />
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`translations.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("name")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("namePlaceholder")}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`translations.${index}.role`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("role")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("rolePlaceholder")}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name={`translations.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("descriptionPlaceholder")}
                        rows={3}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`translations.${index}.biography`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("biography")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("biographyPlaceholder")}
                        rows={5}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`translations.${index}.weapons`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("weapons")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("weaponsPlaceholder")}
                        rows={3}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );
      })}
      {form.formState.errors.translations?.root && (
        <p className="text-sm font-medium text-destructive">
          {form.formState.errors.translations.root.message}
        </p>
      )}
    </div>
  );
}
