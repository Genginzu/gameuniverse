"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { type UseFormReturn } from "react-hook-form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Form } from "@/components/ui/form";

import type { AdminCharacterFormData } from "@/lib/validations/admin-character-form";
import {
  SUPPORTED_LANGUAGES,
  type CharacterTabId,
  type CharacterTab,
} from "@/types/admin-characters";
import type { AvailableGame, AvailableCharacter, AvailableRole } from "@/hooks/useCharacterForm";
import { CharacterHeroBanner } from "./CharacterFormShell";
import { CharacterFormTabContent } from "./CharacterFormTabContent";
import { CharacterTabNavigation, CharacterStickySubmitBar } from "./CharacterFormNavigation";
import { Icon } from "@iconify/react";

export interface CharacterFormProps {
  mode: "create" | "edit";
  form: UseFormReturn<AdminCharacterFormData>;
  availableGames: AvailableGame[];
  availableCharacters: AvailableCharacter[];
  availableRoles: AvailableRole[];
  loadingOptions: boolean;
  onSubmit: (data: AdminCharacterFormData) => Promise<void>;
  isSubmitting: boolean;
  currentCharacterId?: string;
  igdbId?: number | null;
}

const TABS: CharacterTab[] = [
  {
    id: "general",
    icon: <Icon icon="fa:info-circle" className="h-3.5 w-3.5" />,
    labelKey: "generalInfo",
  },
  { id: "images", icon: <Icon icon="fa:image" className="h-3.5 w-3.5" />, labelKey: "images" },
  {
    id: "translations",
    icon: <Icon icon="fa:globe" className="h-3.5 w-3.5" />,
    labelKey: "translations",
  },
  { id: "roles", icon: <Icon icon="fa:id-badge" className="h-3.5 w-3.5" />, labelKey: "roles" },
  { id: "gender", icon: <Icon icon="lucide:user" className="h-3.5 w-3.5" />, labelKey: "gender" },
  { id: "species", icon: <Icon icon="lucide:dna" className="h-3.5 w-3.5" />, labelKey: "species" },
  { id: "games", icon: <Icon icon="fa:gamepad" className="h-3.5 w-3.5" />, labelKey: "games" },
  {
    id: "relationships",
    icon: <Icon icon="fa:users" className="h-3.5 w-3.5" />,
    labelKey: "relationships",
  },
  {
    id: "screenshots",
    icon: <Icon icon="fa:camera" className="h-3.5 w-3.5" />,
    labelKey: "screenshots",
  },
  {
    id: "artwork",
    icon: <Icon icon="fa:paint-brush" className="h-3.5 w-3.5" />,
    labelKey: "artwork",
  },
  { id: "videos", icon: <Icon icon="fa:video" className="h-3.5 w-3.5" />, labelKey: "videos" },
  { id: "sync", icon: <Icon icon="fa:sync" className="h-3.5 w-3.5" />, labelKey: "sync" },
];

export function CharacterForm({
  mode,
  form,
  availableGames,
  availableCharacters,
  availableRoles,
  loadingOptions,
  onSubmit,
  isSubmitting,
  currentCharacterId,
  igdbId,
}: CharacterFormProps) {
  const t = useTranslations("admin.characters.form");
  const tCommon = useTranslations("common");
  const [activeTab, setActiveTab] = useState<CharacterTabId>("general");

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

  const visibleTabs = igdbId ? TABS : TABS.filter((tab) => tab.id !== "sync");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, () => navigateToErrorTab())}
        className="space-y-5 pb-24"
        noValidate
      >
        <CharacterHeroBanner form={form} t={t} />
        <CharacterTabNavigation
          tabs={visibleTabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          form={form}
          tabLabel={tabLabel}
        />
        <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-xs dark:border-gray-700/40 dark:bg-gray-800/60">
          <CharacterFormTabContent
            activeTab={activeTab}
            mode={mode}
            form={form}
            t={t}
            availableGames={availableGames}
            availableCharacters={availableCharacters}
            availableRoles={availableRoles}
            currentCharacterId={currentCharacterId}
            characterIgdbId={igdbId}
          />
        </div>
        <CharacterStickySubmitBar
          tabs={visibleTabs}
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
