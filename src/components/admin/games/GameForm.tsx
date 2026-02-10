"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  FaSave,
  FaImage,
  FaGlobe,
  FaTag,
  FaBuilding,
  FaInfoCircle,
  FaPlus,
  FaTimes,
  FaShieldAlt,
  FaBoxes,
  FaLanguage,
} from "react-icons/fa";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";
import type {
  Genre,
  Company,
  Rating,
  ContentDescriptor,
  SupportedLanguage,
} from "@/hooks/useGameForm";

export interface GameFormProps {
  mode: "create" | "edit";
  form: UseFormReturn<AdminGameFormData>;
  genres: Genre[];
  companies: Company[];
  ratings: Rating[];
  contentDescriptors: ContentDescriptor[];
  supportedLanguages: SupportedLanguage[];
  loadingOptions: boolean;
  onSubmit: (data: AdminGameFormData) => Promise<void>;
  isSubmitting: boolean;
}

const SUPPORTED_LANGUAGES = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

type TabId =
  | "general"
  | "images"
  | "translations"
  | "genres"
  | "companies"
  | "age_ratings"
  | "versions"
  | "languages";

interface Tab {
  id: TabId;
  icon: React.ReactNode;
  labelKey: string;
}

const TABS: Tab[] = [
  { id: "general", icon: <FaInfoCircle className="h-3.5 w-3.5" />, labelKey: "generalInfo" },
  { id: "images", icon: <FaImage className="h-3.5 w-3.5" />, labelKey: "images" },
  { id: "translations", icon: <FaGlobe className="h-3.5 w-3.5" />, labelKey: "translations" },
  { id: "genres", icon: <FaTag className="h-3.5 w-3.5" />, labelKey: "genres" },
  { id: "companies", icon: <FaBuilding className="h-3.5 w-3.5" />, labelKey: "companies" },
  { id: "age_ratings", icon: <FaShieldAlt className="h-3.5 w-3.5" />, labelKey: "ageRatings" },
  { id: "versions", icon: <FaBoxes className="h-3.5 w-3.5" />, labelKey: "versions" },
  { id: "languages", icon: <FaLanguage className="h-3.5 w-3.5" />, labelKey: "gameLanguages" },
];

/** Extracted Companies tab with add-from-dropdown UX */
function CompaniesTab({
  form,
  companies,
  toggleCompany,
  t,
}: {
  form: UseFormReturn<AdminGameFormData>;
  companies: Company[];
  toggleCompany: (companyId: string, role: "developer" | "publisher") => void;
  t: (key: string) => string;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const watchedCompanies = form.watch("companies");

  // Companies already assigned (unique by company_id)
  const assignedIds = [...new Set(watchedCompanies.map((c) => c.company_id))];
  const assignedCompanies = assignedIds
    .map((id) => companies.find((c) => c.id === id))
    .filter(Boolean) as Company[];

  // Companies available to add
  const availableCompanies = companies.filter((c) => !assignedIds.includes(c.id));

  const addCompany = (companyId: string) => {
    // Add as developer by default
    const current = form.getValues("companies");
    form.setValue(
      "companies",
      [...current, { company_id: companyId, role: "developer", is_primary: false }],
      {
        shouldValidate: true,
      }
    );
    setShowPicker(false);
  };

  const removeCompany = (companyId: string) => {
    const current = form.getValues("companies");
    form.setValue(
      "companies",
      current.filter((c) => c.company_id !== companyId),
      { shouldValidate: true }
    );
  };

  return (
    <div className="space-y-4">
      {/* Assigned companies list */}
      {assignedCompanies.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
          {t("noCompanies")}
        </p>
      ) : (
        <div className="space-y-2">
          {assignedCompanies.map((company) => {
            const isDev = watchedCompanies.some(
              (c) => c.company_id === company.id && c.role === "developer"
            );
            const isPub = watchedCompanies.some(
              (c) => c.company_id === company.id && c.role === "publisher"
            );

            return (
              <div
                key={company.id}
                className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 dark:bg-primary/10"
              >
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {company.name}
                </span>
                <div className="flex items-center gap-4">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                    <Checkbox
                      checked={isDev}
                      onCheckedChange={() => toggleCompany(company.id, "developer")}
                      aria-label={`${company.name} - ${t("developer")}`}
                    />
                    {t("developer")}
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                    <Checkbox
                      checked={isPub}
                      onCheckedChange={() => toggleCompany(company.id, "publisher")}
                      aria-label={`${company.name} - ${t("publisher")}`}
                    />
                    {t("publisher")}
                  </label>
                  <button
                    type="button"
                    onClick={() => removeCompany(company.id)}
                    className="ml-1 rounded-md p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    aria-label={`Remove ${company.name}`}
                  >
                    <FaTimes className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add company picker */}
      {showPicker ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700/30 dark:bg-gray-900/20">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("addCompany") ?? "Ajouter une entreprise"}
            </span>
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <FaTimes className="h-3 w-3" />
            </button>
          </div>
          {availableCompanies.length === 0 ? (
            <p className="text-sm text-gray-400">
              {t("allCompaniesAdded") ?? "Toutes les entreprises sont déjà ajoutées"}
            </p>
          ) : (
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) addCompany(e.target.value);
              }}
            >
              <option value="" disabled>
                {t("selectCompany") ?? "Sélectionner une entreprise..."}
              </option>
              {availableCompanies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPicker(true)}
          className="gap-1.5"
          disabled={availableCompanies.length === 0}
        >
          <FaPlus className="h-3 w-3" />
          {t("addCompany") ?? "Ajouter une entreprise"}
        </Button>
      )}

      {form.formState.errors.companies && (
        <p className="text-sm font-medium text-destructive">
          {form.formState.errors.companies.message}
        </p>
      )}
    </div>
  );
}

/** Extracted Age Ratings tab */
function AgeRatingsTab({
  form,
  ratings,
  contentDescriptors,
  t,
}: {
  form: UseFormReturn<AdminGameFormData>;
  ratings: Rating[];
  contentDescriptors: ContentDescriptor[];
  t: (key: string) => string;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const watchedRatings = form.watch("age_ratings");

  const assignedIds = watchedRatings.map((r) => r.rating_id);
  const assignedRatings = assignedIds
    .map((id) => ratings.find((r) => r.id === id))
    .filter(Boolean) as Rating[];

  const availableRatings = ratings.filter((r) => !assignedIds.includes(r.id));

  // Group available ratings by system
  const groupedAvailable = availableRatings.reduce(
    (acc, r) => {
      const systemName = r.system?.name || "Other";
      if (!acc[systemName]) acc[systemName] = [];
      acc[systemName].push(r);
      return acc;
    },
    {} as Record<string, Rating[]>
  );

  const addRating = (ratingId: string) => {
    const current = form.getValues("age_ratings");
    form.setValue(
      "age_ratings",
      [
        ...current,
        { rating_id: ratingId, is_primary: current.length === 0, content_descriptors: [] },
      ],
      { shouldValidate: true }
    );
    setShowPicker(false);
  };

  const removeRating = (ratingId: string) => {
    const current = form.getValues("age_ratings");
    const updated = current.filter((r) => r.rating_id !== ratingId);
    if (updated.length > 0 && !updated.some((r) => r.is_primary)) {
      updated[0].is_primary = true;
    }
    form.setValue("age_ratings", updated, { shouldValidate: true });
  };

  const setPrimary = (ratingId: string) => {
    const current = form.getValues("age_ratings");
    form.setValue(
      "age_ratings",
      current.map((r) => ({ ...r, is_primary: r.rating_id === ratingId })),
      { shouldValidate: true }
    );
  };

  const toggleDescriptor = (ratingId: string, descriptorId: string) => {
    const current = form.getValues("age_ratings");
    form.setValue(
      "age_ratings",
      current.map((r) => {
        if (r.rating_id !== ratingId) return r;
        const has = r.content_descriptors.includes(descriptorId);
        return {
          ...r,
          content_descriptors: has
            ? r.content_descriptors.filter((d) => d !== descriptorId)
            : [...r.content_descriptors, descriptorId],
        };
      }),
      { shouldValidate: true }
    );
  };

  const getDescriptorsForRating = (rating: Rating) => {
    if (!rating.system) return [];
    return contentDescriptors.filter((cd) => cd.rating_system_id === rating.system!.id);
  };

  return (
    <div className="space-y-4">
      {assignedRatings.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
          {t("noAgeRatings") ?? "Aucune classification d'âge"}
        </p>
      ) : (
        <div className="space-y-3">
          {assignedRatings.map((rating) => {
            const formRating = watchedRatings.find((r) => r.rating_id === rating.id);
            const isPrimary = formRating?.is_primary;
            const selectedDescriptors = formRating?.content_descriptors ?? [];
            const availableDescriptors = getDescriptorsForRating(rating);

            return (
              <div
                key={rating.id}
                className="rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10"
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    {rating.color_hex && (
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: rating.color_hex }}
                      >
                        {rating.minimum_age !== null ? `${rating.minimum_age}+` : ""}
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {rating.display_name}
                      </span>
                      {rating.system && (
                        <p className="text-xs text-gray-400">{rating.system.name}</p>
                      )}
                      {rating.minimum_age !== null && (
                        <p className="text-xs text-gray-500">
                          {t("minimumAge") ?? "Âge minimum"} : {rating.minimum_age}+
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                      <Checkbox
                        checked={isPrimary}
                        onCheckedChange={() => setPrimary(rating.id)}
                        aria-label={`${rating.display_name} - ${t("primary") ?? "Principal"}`}
                      />
                      {t("primary") ?? "Principal"}
                    </label>
                    <button
                      type="button"
                      onClick={() => removeRating(rating.id)}
                      className="rounded-md p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                      aria-label={`Remove ${rating.display_name}`}
                    >
                      <FaTimes className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {availableDescriptors.length > 0 && (
                  <div className="border-t border-primary/10 px-4 py-3">
                    <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                      ⚠ {t("contentDescriptors") ?? "Avertissements de contenu"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {availableDescriptors.map((cd) => {
                        const selected = selectedDescriptors.includes(cd.id);
                        return (
                          <button
                            key={cd.id}
                            type="button"
                            onClick={() => toggleDescriptor(rating.id, cd.id)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                              selected
                                ? "border-primary bg-primary/10 text-primary dark:bg-primary/20"
                                : "border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400"
                            }`}
                            aria-pressed={selected}
                          >
                            {cd.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showPicker ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700/30 dark:bg-gray-900/20">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("addAgeRating") ?? "Ajouter une classification"}
            </span>
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <FaTimes className="h-3 w-3" />
            </button>
          </div>
          {availableRatings.length === 0 ? (
            <p className="text-sm text-gray-400">
              {t("allAgeRatingsAdded") ?? "Toutes les classifications sont déjà ajoutées"}
            </p>
          ) : (
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) addRating(e.target.value);
              }}
            >
              <option value="" disabled>
                {t("selectAgeRating") ?? "Sélectionner une classification..."}
              </option>
              {Object.entries(groupedAvailable).map(([systemName, systemRatings]) => (
                <optgroup key={systemName} label={systemName}>
                  {systemRatings.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.display_name}
                      {r.minimum_age !== null ? ` (${r.minimum_age}+)` : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPicker(true)}
          className="gap-1.5"
          disabled={availableRatings.length === 0}
        >
          <FaPlus className="h-3 w-3" />
          {t("addAgeRating") ?? "Ajouter une classification"}
        </Button>
      )}
    </div>
  );
}

/** Extracted Versions tab */
function VersionsTab({
  form,
  t,
}: {
  form: UseFormReturn<AdminGameFormData>;
  t: (key: string) => string;
}) {
  const watchedVersions = form.watch("versions");

  const addVersion = () => {
    const current = form.getValues("versions");
    form.setValue("versions", [
      ...current,
      { version_title: "", description: "", cover_image_url: "", display_order: current.length },
    ]);
  };

  const removeVersion = (idx: number) => {
    const current = form.getValues("versions");
    form.setValue(
      "versions",
      current.filter((_, i) => i !== idx),
      { shouldValidate: true }
    );
  };

  return (
    <div className="space-y-4">
      {watchedVersions.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
          {t("noVersions") ?? "Aucune version"}
        </p>
      ) : (
        <div className="space-y-3">
          {watchedVersions.map((_, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-700/30 dark:bg-gray-900/20"
            >
              <div className="flex items-start gap-4">
                {form.watch(`versions.${idx}.cover_image_url`) && (
                  <img
                    src={form.watch(`versions.${idx}.cover_image_url`) || ""}
                    alt=""
                    className="h-24 w-16 flex-shrink-0 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <Input
                    placeholder={t("versionTitle") ?? "Nom de la version (ex: Deluxe Edition)"}
                    {...form.register(`versions.${idx}.version_title`)}
                  />
                  <Input
                    type="url"
                    placeholder={t("versionCoverUrl") ?? "URL de l'image de couverture"}
                    {...form.register(`versions.${idx}.cover_image_url`)}
                  />
                  <Textarea
                    placeholder={t("versionDescription") ?? "Description de la version..."}
                    rows={2}
                    {...form.register(`versions.${idx}.description`)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeVersion(idx)}
                  className="mt-2 flex-shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  aria-label="Supprimer"
                >
                  <FaTimes className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={addVersion} className="gap-1.5">
        <FaPlus className="h-3 w-3" />
        {t("addVersion") ?? "Ajouter une version"}
      </Button>

      {form.formState.errors.versions && (
        <p className="text-sm font-medium text-destructive">
          {form.formState.errors.versions.message}
        </p>
      )}
    </div>
  );
}

/** Extracted Languages tab */
function LanguagesTab({
  form,
  t,
  supportedLanguages,
}: {
  form: UseFormReturn<AdminGameFormData>;
  t: (key: string) => string;
  supportedLanguages: SupportedLanguage[];
}) {
  const watchedLanguages = form.watch("languages");

  // Languages already added (to filter them out of the dropdown)
  const usedCodes = new Set(watchedLanguages.map((l) => l.language_code));

  const availableLanguages = supportedLanguages.filter((l) => !usedCodes.has(l.code));

  const addLanguage = (code: string) => {
    const lang = supportedLanguages.find((l) => l.code === code);
    if (!lang) return;
    const current = form.getValues("languages");
    form.setValue("languages", [
      ...current,
      {
        language_code: lang.code,
        language_name: lang.name,
        has_audio: false,
        has_subtitles: false,
        has_interface: false,
      },
    ]);
  };

  const removeLanguage = (idx: number) => {
    const current = form.getValues("languages");
    form.setValue(
      "languages",
      current.filter((_, i) => i !== idx),
      { shouldValidate: true }
    );
  };

  // Resolve display name from supportedLanguages (fallback to stored language_name)
  const displayName = (l: { language_code: string; language_name: string }) => {
    const ref = supportedLanguages.find((s) => s.code === l.language_code);
    return ref ? `${ref.native_name} (${ref.name})` : l.language_name;
  };

  return (
    <div className="space-y-4">
      {watchedLanguages.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
          {t("noLanguages") ?? "Aucune langue"}
        </p>
      ) : (
        <div className="space-y-3">
          {/* Header row */}
          <div className="hidden items-center gap-4 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 sm:flex">
            <div className="flex-1">{t("langName") ?? "Langue"}</div>
            <div className="w-20 text-center">{t("langInterface") ?? "Interface"}</div>
            <div className="w-20 text-center">{t("langSubtitles") ?? "Sous-titres"}</div>
            <div className="w-20 text-center">{t("langAudio") ?? "Audio"}</div>
            <div className="w-8" />
          </div>
          {watchedLanguages.map((lang, idx) => (
            <div
              key={lang.language_code || idx}
              className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-700/30 dark:bg-gray-900/20 sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                <span className="mr-2 inline-block rounded bg-gray-200/80 px-1.5 py-0.5 font-mono text-xs text-gray-500 dark:bg-gray-700/60 dark:text-gray-400">
                  {lang.language_code}
                </span>
                {displayName(lang)}
              </div>
              <label className="inline-flex w-20 cursor-pointer items-center justify-center gap-1.5 text-xs">
                <Checkbox
                  checked={form.watch(`languages.${idx}.has_interface`)}
                  onCheckedChange={(v) => form.setValue(`languages.${idx}.has_interface`, !!v)}
                />
                <span className="sm:hidden">{t("langInterface") ?? "Interface"}</span>
              </label>
              <label className="inline-flex w-20 cursor-pointer items-center justify-center gap-1.5 text-xs">
                <Checkbox
                  checked={form.watch(`languages.${idx}.has_subtitles`)}
                  onCheckedChange={(v) => form.setValue(`languages.${idx}.has_subtitles`, !!v)}
                />
                <span className="sm:hidden">{t("langSubtitles") ?? "Sous-titres"}</span>
              </label>
              <label className="inline-flex w-20 cursor-pointer items-center justify-center gap-1.5 text-xs">
                <Checkbox
                  checked={form.watch(`languages.${idx}.has_audio`)}
                  onCheckedChange={(v) => form.setValue(`languages.${idx}.has_audio`, !!v)}
                />
                <span className="sm:hidden">{t("langAudio") ?? "Audio"}</span>
              </label>
              <button
                type="button"
                onClick={() => removeLanguage(idx)}
                className="flex-shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                aria-label="Supprimer"
              >
                <FaTimes className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropdown to add a language */}
      {availableLanguages.length > 0 && (
        <select
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition-colors hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-600"
          value=""
          onChange={(e) => {
            if (e.target.value) addLanguage(e.target.value);
          }}
        >
          <option value="">{t("addLanguage") ?? "Ajouter une langue…"}</option>
          {availableLanguages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.native_name} ({l.name})
            </option>
          ))}
        </select>
      )}

      {form.formState.errors.languages && (
        <p className="text-sm font-medium text-destructive">
          {form.formState.errors.languages.message}
        </p>
      )}
    </div>
  );
}

export function GameForm({
  mode,
  form,
  genres,
  companies,
  ratings,
  contentDescriptors,
  supportedLanguages,
  loadingOptions,
  onSubmit,
  isSubmitting,
}: GameFormProps) {
  const t = useTranslations("admin.games.form");
  const [activeTab, setActiveTab] = useState<TabId>("general");

  // Ensure all supported languages have a translation entry
  const currentTranslations = form.watch("translations");
  useEffect(() => {
    if (currentTranslations.length < SUPPORTED_LANGUAGES.length) {
      const missing = SUPPORTED_LANGUAGES.filter(
        (l) => !currentTranslations.some((t) => t.language_code === l.code)
      );
      if (missing.length > 0) {
        form.setValue("translations", [
          ...currentTranslations,
          ...missing.map((l) => ({ language_code: l.code, title: "", description: "" })),
        ]);
      }
    }
  }, [currentTranslations, form]);

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
      form.setValue("genres", [...current, { genre_id: genreId }], { shouldValidate: true });
    }
  };

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

  const coverImageUrl = form.watch("cover_image_url");
  const backgroundImageUrl = form.watch("background_image_url");

  if (loadingOptions) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  // Tab label helper — uses translation key if available, falls back to id
  const tabLabel = (tab: Tab) => {
    try {
      return t(tab.labelKey);
    } catch {
      return tab.id;
    }
  };

  // Navigate to the first tab that has validation errors
  const navigateToErrorTab = () => {
    const errors = form.formState.errors;
    if (
      errors.slug ||
      errors.release_date ||
      errors.metascore ||
      errors.playtime_hastily ||
      errors.playtime_normally ||
      errors.playtime_completely
    ) {
      setActiveTab("general");
      return;
    }
    if (
      errors.cover_image_url ||
      errors.background_image_url ||
      errors.screenshots ||
      errors.artwork
    ) {
      setActiveTab("images");
      return;
    }
    if (errors.translations) {
      setActiveTab("translations");
      return;
    }
    if (errors.genres) {
      setActiveTab("genres");
      return;
    }
    if (errors.companies) {
      setActiveTab("companies");
      return;
    }
    if (errors.versions) {
      setActiveTab("versions");
      return;
    }
    if (errors.languages) {
      setActiveTab("languages");
      return;
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, () => navigateToErrorTab())}
        className="space-y-5 pb-24"
        noValidate
      >
        {/* ── Hero banner ── */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-gradient-to-br from-gray-900 to-gray-800 shadow-lg dark:border-gray-700/40">
          {backgroundImageUrl ? (
            <img
              src={backgroundImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-40"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-700/30 via-transparent to-transparent" />
          )}
          <div className="relative z-10 flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:gap-8">
            <div className="flex-shrink-0">
              {coverImageUrl ? (
                <img
                  src={coverImageUrl}
                  alt="Cover"
                  className="h-44 w-32 rounded-xl border-2 border-white/20 object-cover shadow-2xl ring-1 ring-black/10"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-44 w-32 items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/5 backdrop-blur-sm">
                  <FaImage className="h-8 w-8 text-white/30" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <p className="truncate text-2xl font-bold text-white drop-shadow-md">
                {form.watch("translations.0.title") || (
                  <span className="italic text-white/40">{t("titlePlaceholder")}</span>
                )}
              </p>
              <p className="mt-1 text-sm text-white/50">
                {form.watch("slug") || "slug"}
                {form.watch("release_date") && (
                  <span className="ml-3">
                    · {new Date(form.watch("release_date")!).getFullYear()}
                  </span>
                )}
              </p>
              {form.watch("genres").length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {form.watch("genres").map((g) => {
                    const genre = genres.find((gn) => gn.id === g.genre_id);
                    return genre ? (
                      <span
                        key={g.genre_id}
                        className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/80 backdrop-blur-sm"
                      >
                        {genre.name}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Tab navigation ── */}
        <nav className="flex flex-wrap gap-1 rounded-xl border border-gray-200/60 bg-white p-1 shadow-sm dark:border-gray-700/40 dark:bg-gray-800/60">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            // Show a count badge for genres and companies
            let badge: number | null = null;
            if (tab.id === "genres") badge = form.watch("genres").length;
            if (tab.id === "companies") badge = form.watch("companies").length;
            if (tab.id === "translations") badge = SUPPORTED_LANGUAGES.length;
            if (tab.id === "images")
              badge = form.watch("screenshots").length + form.watch("artwork").length;
            if (tab.id === "age_ratings") badge = form.watch("age_ratings").length;
            if (tab.id === "versions") badge = form.watch("versions").length;
            if (tab.id === "languages") badge = form.watch("languages").length;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-300"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tabLabel(tab)}</span>
                {badge !== null && badge > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none ${
                      isActive
                        ? "bg-white/20 text-primary-foreground"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Tab content ── */}
        <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm dark:border-gray-700/40 dark:bg-gray-800/60">
          {/* ── General ── */}
          {activeTab === "general" && (
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
                          onChange={(e) =>
                            field.onChange(e.target.value === "" ? "" : e.target.value)
                          }
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
                  <span className="font-normal text-gray-400">
                    ({t("playtimeUnit") ?? "en heures"})
                  </span>
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
                            onChange={(e) =>
                              field.onChange(e.target.value === "" ? "" : e.target.value)
                            }
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
                            onChange={(e) =>
                              field.onChange(e.target.value === "" ? "" : e.target.value)
                            }
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
                            onChange={(e) =>
                              field.onChange(e.target.value === "" ? "" : e.target.value)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Images ── */}
          {activeTab === "images" && (
            <div className="space-y-8">
              {/* Cover & Background */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
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
                  {coverImageUrl && (
                    <img
                      src={coverImageUrl}
                      alt="Cover preview"
                      className="h-96 rounded-xl border border-gray-200 object-contain dark:border-gray-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                </div>
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="background_image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("backgroundImage")}</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder={t("backgroundImagePlaceholder")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {backgroundImageUrl && (
                    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                      <img
                        src={backgroundImageUrl}
                        alt="Background preview"
                        className="w-full object-contain"
                        style={{ maxHeight: "360px" }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).parentElement!.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Screenshots */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t("screenshots") ?? "Captures d'écran"}{" "}
                    <span className="font-normal text-gray-400">
                      ({form.watch("screenshots").length})
                    </span>
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      const current = form.getValues("screenshots");
                      form.setValue("screenshots", [
                        ...current,
                        {
                          url: "",
                          alt_text: "",
                          caption: "",
                          display_order: current.length,
                          is_featured: false,
                        },
                      ]);
                    }}
                  >
                    <FaPlus className="h-3 w-3" />
                    {t("addScreenshot") ?? "Ajouter"}
                  </Button>
                </div>
                {form.watch("screenshots").length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-400">
                    {t("noScreenshots") ?? "Aucune capture d'écran"}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {form.watch("screenshots").map((_, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-700/30 dark:bg-gray-900/20"
                      >
                        <div className="flex items-start gap-4">
                          {form.watch(`screenshots.${idx}.url`) && (
                            <img
                              src={form.watch(`screenshots.${idx}.url`)}
                              alt={form.watch(`screenshots.${idx}.alt_text`) || ""}
                              className="h-20 w-32 flex-shrink-0 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          )}
                          <div className="min-w-0 flex-1 space-y-2">
                            <Input
                              type="url"
                              placeholder="URL"
                              {...form.register(`screenshots.${idx}.url`)}
                            />
                            <Input
                              placeholder={t("altText") ?? "Texte alternatif"}
                              {...form.register(`screenshots.${idx}.alt_text`)}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const current = form.getValues("screenshots");
                              form.setValue(
                                "screenshots",
                                current.filter((_, i) => i !== idx)
                              );
                            }}
                            className="mt-2 flex-shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                            aria-label="Supprimer"
                          >
                            <FaTimes className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Artwork */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t("artwork") ?? "Illustrations"}{" "}
                    <span className="font-normal text-gray-400">
                      ({form.watch("artwork").length})
                    </span>
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      const current = form.getValues("artwork");
                      form.setValue("artwork", [
                        ...current,
                        {
                          url: "",
                          alt_text: "",
                          caption: "",
                          artwork_type: "",
                          display_order: current.length,
                          is_featured: false,
                        },
                      ]);
                    }}
                  >
                    <FaPlus className="h-3 w-3" />
                    {t("addArtwork") ?? "Ajouter"}
                  </Button>
                </div>
                {form.watch("artwork").length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-400">
                    {t("noArtwork") ?? "Aucune illustration"}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {form.watch("artwork").map((_, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-700/30 dark:bg-gray-900/20"
                      >
                        <div className="flex items-start gap-4">
                          {form.watch(`artwork.${idx}.url`) && (
                            <img
                              src={form.watch(`artwork.${idx}.url`)}
                              alt={form.watch(`artwork.${idx}.alt_text`) || ""}
                              className="h-20 w-32 flex-shrink-0 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          )}
                          <div className="min-w-0 flex-1 space-y-2">
                            <Input
                              type="url"
                              placeholder="URL"
                              {...form.register(`artwork.${idx}.url`)}
                            />
                            <Input
                              placeholder={t("altText") ?? "Texte alternatif"}
                              {...form.register(`artwork.${idx}.alt_text`)}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const current = form.getValues("artwork");
                              form.setValue(
                                "artwork",
                                current.filter((_, i) => i !== idx)
                              );
                            }}
                            className="mt-2 flex-shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                            aria-label="Supprimer"
                          >
                            <FaTimes className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Translations ── */}
          {activeTab === "translations" && (
            <div className="space-y-4">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const index = form
                  .watch("translations")
                  .findIndex((t) => t.language_code === lang.code);
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
                    <input
                      type="hidden"
                      {...form.register(`translations.${index}.language_code`)}
                    />
                    <div className="space-y-4">
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
                                rows={4}
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
          )}

          {/* ── Genres ── */}
          {activeTab === "genres" && (
            <div>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                {form.watch("genres").length}{" "}
                {form.watch("genres").length === 1 ? "genre" : "genres"}
              </p>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => {
                  const selected = form.watch("genres").some((g) => g.genre_id === genre.id);
                  return (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => toggleGenre(genre.id)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                        selected
                          ? "border-primary bg-primary/10 text-primary shadow-sm dark:bg-primary/20"
                          : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
                      }`}
                      aria-pressed={selected}
                      aria-label={genre.name}
                    >
                      {genre.name}
                    </button>
                  );
                })}
              </div>
              {form.formState.errors.genres && (
                <p className="mt-3 text-sm font-medium text-destructive">
                  {form.formState.errors.genres.message}
                </p>
              )}
            </div>
          )}

          {/* ── Companies ── */}
          {activeTab === "companies" && (
            <CompaniesTab form={form} companies={companies} toggleCompany={toggleCompany} t={t} />
          )}

          {/* ── Age Ratings ── */}
          {activeTab === "age_ratings" && (
            <AgeRatingsTab
              form={form}
              ratings={ratings}
              contentDescriptors={contentDescriptors}
              t={t}
            />
          )}

          {/* ── Versions ── */}
          {activeTab === "versions" && <VersionsTab form={form} t={t} />}

          {/* ── Languages ── */}
          {activeTab === "languages" && (
            <LanguagesTab form={form} t={t} supportedLanguages={supportedLanguages} />
          )}
        </div>

        {/* ── Sticky submit bar ── */}
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200/60 bg-white/80 backdrop-blur-xl dark:border-gray-700/40 dark:bg-gray-900/80 lg:left-64">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            {/* Tab navigation arrows */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={activeTab === TABS[0].id}
                onClick={() => {
                  const idx = TABS.findIndex((t) => t.id === activeTab);
                  if (idx > 0) setActiveTab(TABS[idx - 1].id);
                }}
              >
                ← {t("previous") ?? "Précédent"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={activeTab === TABS[TABS.length - 1].id}
                onClick={() => {
                  const idx = TABS.findIndex((t) => t.id === activeTab);
                  if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1].id);
                }}
              >
                {t("next") ?? "Suivant"} →
              </Button>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="min-w-[140px] gap-2 shadow-lg"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <FaSave className="h-4 w-4" />
                  {mode === "create" ? t("create") : t("save")}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
