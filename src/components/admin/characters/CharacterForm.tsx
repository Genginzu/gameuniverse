"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { type UseFormReturn } from "react-hook-form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import type { AdminCharacterFormData } from "@/lib/validations/admin-character-form";
import {
  SUPPORTED_LANGUAGES,
  type CharacterTabId,
  type CharacterTab,
} from "@/types/admin-characters";
import type { AvailableGame, AvailableCharacter } from "@/hooks/useCharacterForm";
import { CharacterHeroBanner } from "./CharacterFormShell";
import { CharacterFormGeneralTab } from "./CharacterFormGeneralTab";
import { CharacterFormImagesTab } from "./CharacterFormImagesTab";
import { CharacterFormTranslationsTab } from "./CharacterFormTranslationsTab";
import { CharacterFormGamesTab } from "./CharacterFormGamesTab";
import { CharacterFormScreenshotsTab } from "./CharacterFormScreenshotsTab";
import { CharacterFormArtworkTab } from "./CharacterFormArtworkTab";
import { CharacterFormVideosTab } from "./CharacterFormVideosTab";
import { CharacterFormRelationsTab } from "./CharacterFormRelationsTab";
import { Icon } from "@iconify/react";

export interface CharacterFormProps {
  mode: "create" | "edit";
  form: UseFormReturn<AdminCharacterFormData>;
  availableGames: AvailableGame[];
  availableCharacters: AvailableCharacter[];
  loadingOptions: boolean;
  onSubmit: (data: AdminCharacterFormData) => Promise<void>;
  isSubmitting: boolean;
  /** ID du personnage en cours d'édition (pour exclure du picker relations) */
  currentCharacterId?: string;
}

const TABS: CharacterTab[] = [
  { id: "general", icon: <Icon icon="fa:info-circle" className="h-3.5 w-3.5"  />, labelKey: "generalInfo" },
  { id: "images", icon: <Icon icon="fa:image" className="h-3.5 w-3.5"  />, labelKey: "images" },
  { id: "translations", icon: <Icon icon="fa:globe" className="h-3.5 w-3.5"  />, labelKey: "translations" },
  { id: "games", icon: <Icon icon="fa:gamepad" className="h-3.5 w-3.5"  />, labelKey: "games" },
  { id: "relationships", icon: <Icon icon="fa:users" className="h-3.5 w-3.5"  />, labelKey: "relationships" },
  { id: "screenshots", icon: <Icon icon="fa:camera" className="h-3.5 w-3.5"  />, labelKey: "screenshots" },
  { id: "artwork", icon: <Icon icon="fa:paint-brush" className="h-3.5 w-3.5"  />, labelKey: "artwork" },
  { id: "videos", icon: <Icon icon="fa:video" className="h-3.5 w-3.5"  />, labelKey: "videos" },
];

export function CharacterForm({
  mode,
  form,
  availableGames,
  availableCharacters,
  loadingOptions,
  onSubmit,
  isSubmitting,
  currentCharacterId,
}: CharacterFormProps) {
  const t = useTranslations("admin.characters.form");
  const tCommon = useTranslations("common");
  const [activeTab, setActiveTab] = useState<CharacterTabId>("general");

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
          ...missing.map((l) => ({
            language_code: l.code,
            name: "",
            role: "",
            description: "",
            biography: "",
            weapons: "",
          })),
        ]);
      }
    }
  }, [currentTranslations, form]);

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

  const tabLabel = (tab: CharacterTab) => {
    try {
      return t(tab.labelKey);
    } catch {
      return tab.id;
    }
  };

  const navigateToErrorTab = () => {
    const errors = form.formState.errors;
    const tabErrorMap: [CharacterTabId, boolean][] = [
      ["general", !!(errors.slug || errors.background_color)],
      ["images", !!(errors.main_image_url || errors.background_image_url)],
      ["translations", !!errors.translations],
      ["games", !!errors.games],
      ["relationships", !!errors.relationships],
      ["screenshots", !!errors.media],
      ["artwork", !!errors.media],
      ["videos", !!errors.media],
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
        <CharacterHeroBanner form={form} t={t} />
        <TabNavigation
          tabs={TABS}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          form={form}
          tabLabel={tabLabel}
        />

        <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm dark:border-gray-700/40 dark:bg-gray-800/60">
          {activeTab === "general" && <CharacterFormGeneralTab form={form} t={t} mode={mode} />}
          {activeTab === "images" && <CharacterFormImagesTab form={form} t={t} />}
          {activeTab === "translations" && <CharacterFormTranslationsTab form={form} t={t} />}
          {activeTab === "games" && (
            <CharacterFormGamesTab form={form} t={t} availableGames={availableGames} />
          )}
          {activeTab === "relationships" && (
            <CharacterFormRelationsTab
              form={form}
              t={t}
              availableCharacters={availableCharacters}
              currentCharacterId={currentCharacterId}
            />
          )}
          {activeTab === "screenshots" && <CharacterFormScreenshotsTab form={form} t={t} />}
          {activeTab === "artwork" && <CharacterFormArtworkTab form={form} t={t} />}
          {activeTab === "videos" && <CharacterFormVideosTab form={form} t={t} />}
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

/** Tab navigation bar with badges */
function TabNavigation({
  tabs,
  activeTab,
  setActiveTab,
  form,
  tabLabel,
}: {
  tabs: CharacterTab[];
  activeTab: CharacterTabId;
  setActiveTab: (id: CharacterTabId) => void;
  form: UseFormReturn<AdminCharacterFormData>;
  tabLabel: (tab: CharacterTab) => string;
}) {
  const getBadge = (tabId: CharacterTabId): number | null => {
    const media = form.watch("media");
    switch (tabId) {
      case "translations":
        return SUPPORTED_LANGUAGES.length;
      case "games":
        return form.watch("games").length;
      case "relationships":
        return form.watch("relationships").length;
      case "screenshots":
        return media.filter((m) => m.type === "screenshot").length;
      case "artwork":
        return media.filter((m) => m.type === "artwork").length;
      case "videos":
        return media.filter((m) => m.type === "video").length;
      default:
        return null;
    }
  };

  return (
    <nav className="flex flex-wrap gap-1 rounded-xl border border-gray-200/60 bg-white p-1 shadow-sm dark:border-gray-700/40 dark:bg-gray-800/60">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const badge = getBadge(tab.id);
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
  );
}

/** Sticky bottom bar with prev/next and submit */
function StickySubmitBar({
  tabs,
  activeTab,
  setActiveTab,
  isSubmitting,
  mode,
  t,
}: {
  tabs: CharacterTab[];
  activeTab: CharacterTabId;
  setActiveTab: (id: CharacterTabId) => void;
  isSubmitting: boolean;
  mode: "create" | "edit";
  t: (key: string) => string;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200/60 bg-white/80 backdrop-blur-xl dark:border-gray-700/40 dark:bg-gray-900/80 lg:left-64">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={activeTab === tabs[0].id}
            onClick={() => {
              const idx = tabs.findIndex((tab) => tab.id === activeTab);
              if (idx > 0) setActiveTab(tabs[idx - 1].id);
            }}
          >
            ← {t("previous") ?? "Précédent"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={activeTab === tabs[tabs.length - 1].id}
            onClick={() => {
              const idx = tabs.findIndex((tab) => tab.id === activeTab);
              if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1].id);
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
              <Icon icon="fa:save" className="h-4 w-4"  />
              {mode === "create" ? t("create") : t("save")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
