"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { type UseFormReturn } from "react-hook-form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Form } from "@/components/ui/form";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";
import { SUPPORTED_LANGUAGES, type AdminGenre, type Company, type Rating, type ContentDescriptor, type TabId, type Tab, type AdminStore, type AdminCurrency } from "@/types/admin-games";
import type { SupportedLanguage } from "@/types/admin-languages";
import { HeroBanner, TabNavigation, StickySubmitBar } from "./GameFormShell";
import { GameFormTabContent } from "./GameFormTabContent";
import { GameFormErrorSummary } from "./GameFormErrorSummary";
import { useGameOverrides } from "@/hooks/useGameOverrides";
import { BASE_TABS, SYNC_TAB } from "./GameFormTabs";

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
  gamePlatforms: Array<{ id: string; slug: string; name: string }>;
  loadingOptions: boolean;
  onSubmit: (data: AdminGameFormData) => Promise<void>;
  isSubmitting: boolean;
  gameId?: string;
  igdbId?: number | null;
  onSyncComplete?: () => void;
}

export function GameForm({
  mode, form, genres, companies, ratings, contentDescriptors, supportedLanguages,
  stores, currencies, platforms, gamePlatforms, loadingOptions, onSubmit, isSubmitting,
  gameId, igdbId, onSyncComplete,
}: GameFormProps) {
  const t = useTranslations("admin.games.form");
  const tCommon = useTranslations("common");
  const [activeTab, setActiveTab] = useState<TabId>("design");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const TABS = useMemo(() => (mode === "edit" ? [...BASE_TABS, SYNC_TAB] : BASE_TABS), [mode]);

  const { isIgdbField, refetchOverrides } = useGameOverrides(
    mode === "edit" ? gameId : undefined, mode === "edit" ? igdbId : undefined
  );
  const igdbFieldProp = mode === "edit" && igdbId ? isIgdbField : undefined;

  const handleSubmit = async (data: AdminGameFormData) => { await onSubmit(data); await refetchOverrides(); };
  const handleSyncComplete = async () => { await onSyncComplete?.(); await refetchOverrides(); };

  const currentTranslations = form.watch("translations");
  useEffect(() => {
    if (currentTranslations.length < SUPPORTED_LANGUAGES.length) {
      const missing = SUPPORTED_LANGUAGES.filter((l) => !currentTranslations.some((tr) => tr.language_code === l.code));
      if (missing.length > 0) {
        form.setValue("translations", [...currentTranslations, ...missing.map((l) => ({ language_code: l.code, title: "", description: "" }))]);
      }
    }
  }, [currentTranslations, form]);

  const toggleGenre = (genreId: string) => {
    const current = form.getValues("genres");
    const exists = current.some((g) => g.genre_id === genreId);
    form.setValue("genres", exists ? current.filter((g) => g.genre_id !== genreId) : [...current, { genre_id: genreId }], { shouldValidate: true });
  };

  const toggleCompany = (companyId: string, role: "developer" | "publisher") => {
    const current = form.getValues("companies");
    const exists = current.some((c) => c.company_id === companyId && c.role === role);
    form.setValue("companies", exists ? current.filter((c) => !(c.company_id === companyId && c.role === role)) : [...current, { company_id: companyId, role, is_primary: false }], { shouldValidate: true });
  };

  const togglePlatform = (platformId: string) => {
    const current = form.getValues("game_platforms");
    const exists = current.some((p) => p.platform_id === platformId);
    form.setValue("game_platforms", exists ? current.filter((p) => p.platform_id !== platformId) : [...current, { platform_id: platformId }], { shouldValidate: true });
  };

  if (loadingOptions) {
    return <div className="flex flex-1 items-center justify-center py-12"><div className="flex items-center gap-3"><LoadingSpinner size="lg" /><span className="text-gray-500 dark:text-gray-400">{tCommon("loading")}</span></div></div>;
  }

  const tabLabel = (tab: Tab) => { try { return t(tab.labelKey); } catch { return tab.id; } };
  const tabLabelById = (tabId: TabId) => { const tab = TABS.find((tab) => tab.id === tabId); return tab ? tabLabel(tab) : tabId; };

  const navigateToErrorTab = () => {
    setHasSubmitted(true);
    const errors = form.formState.errors;
    const tabErrorMap: [TabId, boolean][] = [
      ["design", !!(errors.background_color || errors.accent_color || errors.label_color || errors.text_color)],
      ["general", !!(errors.release_date || errors.metascore || errors.playtime_hastily || errors.playtime_normally || errors.playtime_completely)],
      ["images", !!(errors.cover_image_url || errors.background_image_url || errors.screenshots || errors.artwork)],
      ["translations", !!errors.translations], ["genres", !!errors.genres], ["companies", !!errors.companies],
      ["versions", !!errors.versions], ["languages", !!errors.languages], ["pricing", !!errors.prices],
      ["music", !!(errors.music_composer || errors.music_spotify_embed_url || errors.music_youtube_video_url)],
    ];
    const firstError = tabErrorMap.find(([, hasError]) => hasError);
    if (firstError) setActiveTab(firstError[0]);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit, () => navigateToErrorTab())} className="space-y-5 pb-24" noValidate>
        <HeroBanner form={form} genres={genres} coverImageUrl={form.watch("cover_image_url")} backgroundImageUrl={form.watch("background_image_url")} t={t} />
        {hasSubmitted && Object.keys(form.formState.errors).length > 0 && <GameFormErrorSummary errors={form.formState.errors} onNavigateToTab={setActiveTab} tabLabel={tabLabelById} />}
        <TabNavigation tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} form={form} tabLabel={tabLabel} />
        <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-xs dark:border-gray-700/40 dark:bg-gray-800/60">
          <GameFormTabContent activeTab={activeTab} mode={mode} form={form} t={t} genres={genres} companies={companies} ratings={ratings} contentDescriptors={contentDescriptors} supportedLanguages={supportedLanguages} stores={stores} currencies={currencies} platforms={platforms} gamePlatforms={gamePlatforms} toggleGenre={toggleGenre} toggleCompany={toggleCompany} togglePlatform={togglePlatform} isIgdbField={igdbFieldProp} gameId={gameId} igdbId={igdbId} onSyncComplete={handleSyncComplete} />
        </div>
        <StickySubmitBar tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} isSubmitting={isSubmitting} mode={mode} t={t} />
      </form>
    </Form>
  );
}
