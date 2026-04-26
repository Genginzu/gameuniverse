"use client";

import { Suspense } from "react";
import { type UseFormReturn } from "react-hook-form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";
import type { AdminGenre, Company, Rating, ContentDescriptor, TabId, TrackableField, AdminStore, AdminCurrency } from "@/types/admin-games";
import type { SupportedLanguage } from "@/types/admin-languages";
import {
  GameFormDesignTab,
  GameFormGeneralTab,
  GameFormImagesTab,
  GameFormTranslationsTab,
  GameFormGenresTab,
  GameFormCompaniesTab,
  GameFormPlatformsTab,
  GameFormAgeRatingsTab,
  GameFormVersionsTab,
  GameFormLanguagesTab,
  GameFormPricingTab,
  GameFormMusicTab,
  GameFormVideosTab,
  GameFormSyncTab,
  GameFormSimilarGamesTab,
} from "./GameFormLazyTabs";

function TabFallback() {
  return <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>;
}

interface GameFormTabContentProps {
  activeTab: TabId;
  mode: "create" | "edit";
  form: UseFormReturn<AdminGameFormData>;
  t: (key: string) => string;
  genres: AdminGenre[];
  companies: Company[];
  ratings: Rating[];
  contentDescriptors: ContentDescriptor[];
  supportedLanguages: SupportedLanguage[];
  stores: AdminStore[];
  currencies: AdminCurrency[];
  platforms: string[];
  gamePlatforms: Array<{ id: string; slug: string; name: string }>;
  toggleGenre: (genreId: string) => void;
  toggleCompany: (companyId: string, role: "developer" | "publisher") => void;
  togglePlatform: (platformId: string) => void;
  isIgdbField?: (field: TrackableField) => boolean;
  gameId?: string;
  igdbId?: number | null;
  onSyncComplete?: () => void;
}

export function GameFormTabContent({
  activeTab, mode, form, t, genres, companies, ratings, contentDescriptors,
  supportedLanguages, stores, currencies, platforms, gamePlatforms,
  toggleGenre, toggleCompany, togglePlatform, isIgdbField, gameId, igdbId, onSyncComplete,
}: GameFormTabContentProps) {
  const renderTab = () => {
    switch (activeTab) {
      case "design":
        return (
          <GameFormDesignTab
            form={form}
            t={t}
            genres={genres}
            companies={companies}
            stores={stores}
          />
        );
      case "general":
        return <GameFormGeneralTab form={form} t={t} isIgdbField={isIgdbField} />;
      case "images":
        return <GameFormImagesTab form={form} t={t} isIgdbField={isIgdbField} />;
      case "translations":
        return (
          <GameFormTranslationsTab form={form} t={t} isIgdbField={isIgdbField} gameId={gameId} />
        );
      case "genres":
        return (
          <GameFormGenresTab
            form={form}
            t={t}
            genres={genres}
            toggleGenre={toggleGenre}
            isIgdbField={isIgdbField}
          />
        );
      case "companies":
        return (
          <GameFormCompaniesTab
            form={form}
            t={t}
            companies={companies}
            toggleCompany={toggleCompany}
            isIgdbField={isIgdbField}
          />
        );
      case "game_platforms":
        return (
          <GameFormPlatformsTab
            form={form}
            t={t}
            gamePlatforms={gamePlatforms}
            togglePlatform={togglePlatform}
            isIgdbField={isIgdbField}
          />
        );
      case "age_ratings":
        return (
          <GameFormAgeRatingsTab
            form={form}
            t={t}
            ratings={ratings}
            contentDescriptors={contentDescriptors}
            isIgdbField={isIgdbField}
          />
        );
      case "versions":
        return <GameFormVersionsTab form={form} t={t} isIgdbField={isIgdbField} />;
      case "languages":
        return (
          <GameFormLanguagesTab
            form={form}
            t={t}
            supportedLanguages={supportedLanguages}
            isIgdbField={isIgdbField}
          />
        );
      case "pricing":
        return (
          <GameFormPricingTab
            form={form}
            t={t}
            stores={stores}
            currencies={currencies}
            platforms={platforms}
          />
        );
      case "music":
        return <GameFormMusicTab form={form} t={t} />;
      case "videos":
        return <GameFormVideosTab form={form} t={t} isIgdbField={isIgdbField} />;
      case "similar_games":
        return mode === "edit" && gameId ? <GameFormSimilarGamesTab gameId={gameId} /> : null;
      case "sync":
        return mode === "edit" && gameId ? (
          <GameFormSyncTab
            gameId={gameId}
            igdbId={igdbId ?? null}
            onSyncComplete={onSyncComplete}
          />
        ) : null;
      default:
        return null;
    }
  };

  return <Suspense fallback={<TabFallback />}>{renderTab()}</Suspense>;
}
