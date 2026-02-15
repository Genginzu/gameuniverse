"use client";

import { useState, useEffect, useMemo } from "react";
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
  FaDollarSign,
  FaPaintBrush,
  FaSync,
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
  type AdminStore,
  type AdminCurrency,
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
import { GameFormPricingTab } from "./GameFormPricingTab";
import { GameFormDesignTab } from "./GameFormDesignTab";
import { GameFormSyncTab } from "./GameFormSyncTab";
import { useGameOverrides } from "@/hooks/useGameOverrides";

export interface GameFormProps {
  mode: "create" | "edit";
  form: UseFormReturn<AdminGameFormData>;
  genres: AdminGenre[];
  companies: Company[];
  ratings: Rating[];
  contentDescriptors: ContentDescriptor[];
  supportedLanguages: SupportedLanguage[];
  stores: AdminStore[];
  currencies: AdminCurrency[];
  platforms: string[];
  loadingOptions: boolean;
  onSubmit: (data: AdminGameFormData) => Promise<void>;
  isSubmitting: boolean;
  /** Only needed in edit mode for the sync tab */
  gameId?: string;
  /** Only needed in edit mode for the sync tab */
  igdbId?: number | null;
}

const BASE_TABS: Tab[] = [
  { id: "design", icon: <FaPaintBrush className="h-3.5 w-3.5" />, labelKey: "design" },
  { id: "general", icon: <FaInfoCircle className="h-3.5 w-3.5" />, labelKey: "generalInfo" },
  { id: "images", icon: <FaImage className="h-3.5 w-3.5" />, labelKey: "images" },
  { id: "translations", icon: <FaGlobe className="h-3.5 w-3.5" />, labelKey: "translations" },
  { id: "genres", icon: <FaTag className="h-3.5 w-3.5" />, labelKey: "genres" },
  { id: "companies", icon: <FaBuilding className="h-3.5 w-3.5" />, labelKey: "companies" },
  { id: "age_ratings", icon: <FaShieldAlt className="h-3.5 w-3.5" />, labelKey: "ageRatings" },
  { id: "versions", icon: <FaBoxes className="h-3.5 w-3.5" />, labelKey: "versions" },
  { id: "languages", icon: <FaLanguage className="h-3.5 w-3.5" />, labelKey: "gameLanguages" },
  { id: "pricing", icon: <FaDollarSign className="h-3.5 w-3.5" />, labelKey: "pricing" },
];

const SYNC_TAB: Tab = {
  id: "sync",
  icon: <FaSync className="h-3.5 w-3.5" />,
  labelKey: "syncTab",
};

export function GameForm({
  mode,
  form,
  genres,
  companies,
  ratings,
  contentDescriptors,
  supportedLanguages,
  stores,
  currencies,
  platforms,
  loadingOptions,
  onSubmit,
  isSubmitting,
  gameId,
  igdbId,
}: GameFormProps) {
  const t = useTranslations("admin.games.form");
  const tCommon = useTranslations("common");
  const [activeTab, setActiveTab] = useState<TabId>("design");

  // Show sync tab only in edit mode
  const TABS = useMemo(() => (mode === "edit" ? [...BASE_TABS, SYNC_TAB] : BASE_TABS), [mode]);

  // IGDB field indicators — only active in edit mode with an igdb_id
  const { isIgdbField } = useGameOverrides(
    mode === "edit" ? gameId : undefined,
    mode === "edit" ? igdbId : undefined
  );
  const igdbFieldProp = mode === "edit" && igdbId ? isIgdbField : undefined;

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
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <LoadingSpinner size="lg" />
          <span className="text-gray-500 dark:text-gray-400">{tCommon("loading")}</span>
        </div>
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
        "design",
        !!(
          errors.background_color ||
          errors.accent_color ||
          errors.label_color ||
          errors.text_color
        ),
      ],
      [
        "general",
        !!(
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
      ["pricing", !!errors.prices],
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
          {activeTab === "design" && (
            <GameFormDesignTab
              form={form}
              t={t}
              genres={genres}
              companies={companies}
              stores={stores}
            />
          )}
          {activeTab === "general" && (
            <GameFormGeneralTab form={form} t={t} isIgdbField={igdbFieldProp} />
          )}
          {activeTab === "images" && (
            <GameFormImagesTab form={form} t={t} isIgdbField={igdbFieldProp} />
          )}
          {activeTab === "translations" && (
            <GameFormTranslationsTab form={form} t={t} isIgdbField={igdbFieldProp} />
          )}
          {activeTab === "genres" && (
            <GameFormGenresTab
              form={form}
              t={t}
              genres={genres}
              toggleGenre={toggleGenre}
              isIgdbField={igdbFieldProp}
            />
          )}
          {activeTab === "companies" && (
            <GameFormCompaniesTab
              form={form}
              t={t}
              companies={companies}
              toggleCompany={toggleCompany}
              isIgdbField={igdbFieldProp}
            />
          )}
          {activeTab === "age_ratings" && (
            <GameFormAgeRatingsTab
              form={form}
              t={t}
              ratings={ratings}
              contentDescriptors={contentDescriptors}
              isIgdbField={igdbFieldProp}
            />
          )}
          {activeTab === "versions" && (
            <GameFormVersionsTab form={form} t={t} isIgdbField={igdbFieldProp} />
          )}
          {activeTab === "languages" && (
            <GameFormLanguagesTab
              form={form}
              t={t}
              supportedLanguages={supportedLanguages}
              isIgdbField={igdbFieldProp}
            />
          )}
          {activeTab === "pricing" && (
            <GameFormPricingTab
              form={form}
              t={t}
              stores={stores}
              currencies={currencies}
              platforms={platforms}
            />
          )}
          {activeTab === "sync" && mode === "edit" && gameId && (
            <GameFormSyncTab gameId={gameId} igdbId={igdbId ?? null} />
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
