"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { type UseFormReturn } from "react-hook-form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Form } from "@/components/ui/form";
import {
  FaImage,
  FaGlobe,
  FaTag,
  FaBuilding,
  FaInfoCircle,
  FaShieldAlt,
  FaBoxes,
  FaLanguage,
} from "react-icons/fa";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";
import {
  SUPPORTED_LANGUAGES,
  type AdminGenre,
  type Company,
  type Rating,
  type ContentDescriptor,
  type TabId,
  type Tab,
} from "@/types/admin-games";
import type { SupportedLanguage } from "@/types/admin-languages";
import { HeroBanner, TabNavigation, StickySubmitBar } from "./GameFormShell";
import { GameFormGeneralTab } from "./GameFormGeneralTab";
import { GameFormImagesTab } from "./GameFormImagesTab";
import { GameFormTranslationsTab } from "./GameFormTranslationsTab";
import { GameFormGenresTab } from "./GameFormGenresTab";
import { GameFormCompaniesTab } from "./GameFormCompaniesTab";
import { GameFormAgeRatingsTab } from "./GameFormAgeRatingsTab";
import { GameFormVersionsTab } from "./GameFormVersionsTab";
import { GameFormLanguagesTab } from "./GameFormLanguagesTab";

export interface GameFormProps {
  mode: "create" | "edit";
  form: UseFormReturn<AdminGameFormData>;
  genres: AdminGenre[];
  companies: Company[];
  ratings: Rating[];
  contentDescriptors: ContentDescriptor[];
  supportedLanguages: SupportedLanguage[];
  loadingOptions: boolean;
  onSubmit: (data: AdminGameFormData) => Promise<void>;
  isSubmitting: boolean;
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
        (l) => !currentTranslations.some((tr) => tr.language_code === l.code)
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
    form.setValue(
      "genres",
      exists ? current.filter((g) => g.genre_id !== genreId) : [...current, { genre_id: genreId }],
      { shouldValidate: true }
    );
  };

  const toggleCompany = (companyId: string, role: "developer" | "publisher") => {
    const current = form.getValues("companies");
    const exists = current.some((c) => c.company_id === companyId && c.role === role);
    form.setValue(
      "companies",
      exists
        ? current.filter((c) => !(c.company_id === companyId && c.role === role))
        : [...current, { company_id: companyId, role, is_primary: false }],
      { shouldValidate: true }
    );
  };

  if (loadingOptions) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  const tabLabel = (tab: Tab) => {
    try {
      return t(tab.labelKey);
    } catch {
      return tab.id;
    }
  };

  const navigateToErrorTab = () => {
    const errors = form.formState.errors;
    const tabErrorMap: [TabId, boolean][] = [
      [
        "general",
        !!(
          errors.slug ||
          errors.release_date ||
          errors.metascore ||
          errors.playtime_hastily ||
          errors.playtime_normally ||
          errors.playtime_completely
        ),
      ],
      [
        "images",
        !!(
          errors.cover_image_url ||
          errors.background_image_url ||
          errors.screenshots ||
          errors.artwork
        ),
      ],
      ["translations", !!errors.translations],
      ["genres", !!errors.genres],
      ["companies", !!errors.companies],
      ["versions", !!errors.versions],
      ["languages", !!errors.languages],
    ];
    const firstError = tabErrorMap.find(([, hasError]) => hasError);
    if (firstError) setActiveTab(firstError[0]);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, () => navigateToErrorTab())}
        className="space-y-5 pb-24"
        noValidate
      >
        <HeroBanner
          form={form}
          genres={genres}
          coverImageUrl={form.watch("cover_image_url")}
          backgroundImageUrl={form.watch("background_image_url")}
          t={t}
        />
        <TabNavigation
          tabs={TABS}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          form={form}
          tabLabel={tabLabel}
        />

        <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm dark:border-gray-700/40 dark:bg-gray-800/60">
          {activeTab === "general" && <GameFormGeneralTab form={form} t={t} mode={mode} />}
          {activeTab === "images" && <GameFormImagesTab form={form} t={t} />}
          {activeTab === "translations" && <GameFormTranslationsTab form={form} t={t} />}
          {activeTab === "genres" && (
            <GameFormGenresTab form={form} t={t} genres={genres} toggleGenre={toggleGenre} />
          )}
          {activeTab === "companies" && (
            <GameFormCompaniesTab
              form={form}
              t={t}
              companies={companies}
              toggleCompany={toggleCompany}
            />
          )}
          {activeTab === "age_ratings" && (
            <GameFormAgeRatingsTab
              form={form}
              t={t}
              ratings={ratings}
              contentDescriptors={contentDescriptors}
            />
          )}
          {activeTab === "versions" && <GameFormVersionsTab form={form} t={t} />}
          {activeTab === "languages" && (
            <GameFormLanguagesTab form={form} t={t} supportedLanguages={supportedLanguages} />
          )}
        </div>

        <StickySubmitBar
          tabs={TABS}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isSubmitting={isSubmitting}
          mode={mode}
          t={t}
        />
      </form>
    </Form>
  );
}
