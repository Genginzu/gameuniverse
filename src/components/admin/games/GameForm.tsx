"use client";

import { useTranslations } from "next-intl";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { FaPlus, FaTrash, FaSave } from "react-icons/fa";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";
import type { Genre, Company } from "@/hooks/useGameForm";

export interface GameFormProps {
  mode: "create" | "edit";
  form: UseFormReturn<AdminGameFormData>;
  genres: Genre[];
  companies: Company[];
  loadingOptions: boolean;
  onSubmit: (data: AdminGameFormData) => Promise<void>;
  isSubmitting: boolean;
}

const SUPPORTED_LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
];

export function GameForm({
  mode,
  form,
  genres,
  companies,
  loadingOptions,
  onSubmit,
  isSubmitting,
}: GameFormProps) {
  const t = useTranslations("admin.games.form");

  const {
    fields: translationFields,
    append: appendTranslation,
    remove: removeTranslation,
  } = useFieldArray({ control: form.control, name: "translations" });

  const handleAddTranslation = () => {
    const usedCodes = form.getValues("translations").map((t) => t.language_code);
    const available = SUPPORTED_LANGUAGES.find((l) => !usedCodes.includes(l.code));
    if (available) {
      appendTranslation({ language_code: available.code, title: "", description: "" });
    }
  };

  const canAddTranslation = translationFields.length < SUPPORTED_LANGUAGES.length;

  // Genre toggle handler
  const toggleGenre = (genreId: string) => {
    const current = form.getValues("genres");
    const exists = current.some((g) => g.genre_id === genreId);
    if (exists) {
      form.setValue(
        "genres",
        current.filter((g) => g.genre_id !== genreId),
        { shouldValidate: true }
      );
    } else {
      form.setValue("genres", [...current, { genre_id: genreId }], {
        shouldValidate: true,
      });
    }
  };

  // Company toggle handler
  const toggleCompany = (companyId: string, role: "developer" | "publisher") => {
    const current = form.getValues("companies");
    const exists = current.some((c) => c.company_id === companyId && c.role === role);
    if (exists) {
      form.setValue(
        "companies",
        current.filter((c) => !(c.company_id === companyId && c.role === role)),
        { shouldValidate: true }
      );
    } else {
      form.setValue("companies", [...current, { company_id: companyId, role, is_primary: false }], {
        shouldValidate: true,
      });
    }
  };

  if (loadingOptions) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>
        {/* Slug */}
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("slug")}</FormLabel>
              <FormControl>
                <Input placeholder={t("slugPlaceholder")} {...field} disabled={mode === "edit"} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Translations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">{t("translations")}</Label>
            {canAddTranslation && (
              <Button type="button" variant="outline" size="sm" onClick={handleAddTranslation}>
                <FaPlus className="mr-1 h-3 w-3" />
                {t("addTranslation")}
              </Button>
            )}
          </div>

          {translationFields.map((field, index) => {
            const langLabel =
              SUPPORTED_LANGUAGES.find((l) => l.code === field.language_code)?.label ??
              field.language_code;

            return (
              <div
                key={field.id}
                className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {langLabel}
                  </span>
                  {translationFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTranslation(index)}
                      className="text-red-600 hover:text-red-700"
                      aria-label={t("removeTranslation")}
                    >
                      <FaTrash className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <input type="hidden" {...form.register(`translations.${index}.language_code`)} />

                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name={`translations.${index}.title`}
                    render={({ field: titleField }) => (
                      <FormItem>
                        <FormLabel>{t("title")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("titlePlaceholder")} {...titleField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`translations.${index}.description`}
                    render={({ field: descField }) => (
                      <FormItem>
                        <FormLabel>{t("description")}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t("descriptionPlaceholder")}
                            rows={3}
                            {...descField}
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

        {/* Cover Image URL */}
        <FormField
          control={form.control}
          name="cover_image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("coverImage")}</FormLabel>
              <FormControl>
                <Input type="url" placeholder={t("coverImagePlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Release Date */}
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

        {/* Genres */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">{t("genres")}</Label>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => {
              const selected = form.watch("genres").some((g) => g.genre_id === genre.id);
              return (
                <label
                  key={genre.id}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                  }`}
                >
                  <Checkbox
                    checked={selected}
                    onCheckedChange={() => toggleGenre(genre.id)}
                    aria-label={genre.name}
                  />
                  {genre.name}
                </label>
              );
            })}
          </div>
          {form.formState.errors.genres && (
            <p className="text-sm font-medium text-destructive">
              {form.formState.errors.genres.message}
            </p>
          )}
        </div>

        {/* Companies */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">{t("companies")}</Label>
          {companies.length === 0 ? (
            <p className="text-sm text-gray-500">{t("noCompanies")}</p>
          ) : (
            <div className="space-y-2">
              {companies.map((company) => {
                const watchedCompanies = form.watch("companies");
                const isDev = watchedCompanies.some(
                  (c) => c.company_id === company.id && c.role === "developer"
                );
                const isPub = watchedCompanies.some(
                  (c) => c.company_id === company.id && c.role === "publisher"
                );

                return (
                  <div
                    key={company.id}
                    className="flex items-center gap-4 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700"
                  >
                    <span className="min-w-[120px] text-sm font-medium">{company.name}</span>
                    <label className="inline-flex items-center gap-1.5 text-sm">
                      <Checkbox
                        checked={isDev}
                        onCheckedChange={() => toggleCompany(company.id, "developer")}
                        aria-label={`${company.name} - ${t("developer")}`}
                      />
                      {t("developer")}
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-sm">
                      <Checkbox
                        checked={isPub}
                        onCheckedChange={() => toggleCompany(company.id, "publisher")}
                        aria-label={`${company.name} - ${t("publisher")}`}
                      />
                      {t("publisher")}
                    </label>
                  </div>
                );
              })}
            </div>
          )}
          {form.formState.errors.companies && (
            <p className="text-sm font-medium text-destructive">
              {form.formState.errors.companies.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 border-t pt-6">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <FaSave className="mr-1 h-4 w-4" />
                {mode === "create" ? t("create") : t("save")}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
