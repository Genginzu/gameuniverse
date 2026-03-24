"use client";

import { lazy, Suspense } from "react";
import { type UseFormReturn } from "react-hook-form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { AdminCharacterFormData } from "@/lib/validations/admin-character-form";
import type { CharacterTabId } from "@/types/admin-characters";
import type { AvailableGame, AvailableCharacter, AvailableRole } from "@/hooks/useCharacterForm";

// Lazy-loaded tab components — only the active tab's JS is loaded
const CharacterFormGeneralTab = lazy(() =>
  import("./CharacterFormGeneralTab").then((m) => ({ default: m.CharacterFormGeneralTab }))
);
const CharacterFormImagesTab = lazy(() =>
  import("./CharacterFormImagesTab").then((m) => ({ default: m.CharacterFormImagesTab }))
);
const CharacterFormTranslationsTab = lazy(() =>
  import("./CharacterFormTranslationsTab").then((m) => ({
    default: m.CharacterFormTranslationsTab,
  }))
);
const CharacterFormRolesTab = lazy(() =>
  import("./CharacterFormRolesTab").then((m) => ({ default: m.CharacterFormRolesTab }))
);
const CharacterFormGamesTab = lazy(() =>
  import("./CharacterFormGamesTab").then((m) => ({ default: m.CharacterFormGamesTab }))
);
const CharacterFormRelationsTab = lazy(() =>
  import("./CharacterFormRelationsTab").then((m) => ({ default: m.CharacterFormRelationsTab }))
);
const CharacterFormScreenshotsTab = lazy(() =>
  import("./CharacterFormScreenshotsTab").then((m) => ({
    default: m.CharacterFormScreenshotsTab,
  }))
);
const CharacterFormArtworkTab = lazy(() =>
  import("./CharacterFormArtworkTab").then((m) => ({ default: m.CharacterFormArtworkTab }))
);
const CharacterFormVideosTab = lazy(() =>
  import("./CharacterFormVideosTab").then((m) => ({ default: m.CharacterFormVideosTab }))
);
const CharacterFormGenderTab = lazy(() =>
  import("./CharacterFormGenderTab").then((m) => ({ default: m.CharacterFormGenderTab }))
);
const CharacterFormSpeciesTab = lazy(() =>
  import("./CharacterFormSpeciesTab").then((m) => ({ default: m.CharacterFormSpeciesTab }))
);
const CharacterFormSyncTab = lazy(() =>
  import("./CharacterFormSyncTab").then((m) => ({ default: m.CharacterFormSyncTab }))
);

function TabFallback() {
  return (
    <div className="flex justify-center py-8">
      <LoadingSpinner size="sm" />
    </div>
  );
}

interface CharacterFormTabContentProps {
  activeTab: CharacterTabId;
  mode: "create" | "edit";
  form: UseFormReturn<AdminCharacterFormData>;
  t: (key: string) => string;
  availableGames: AvailableGame[];
  availableCharacters: AvailableCharacter[];
  availableRoles: AvailableRole[];
  currentCharacterId?: string;
  /** Character ID for sync tab (edit mode only) */
  characterIgdbId?: number | null;
}

/** Renders the active tab's content with lazy loading */
export function CharacterFormTabContent({
  activeTab,
  mode,
  form,
  t,
  availableGames,
  availableCharacters,
  availableRoles,
  currentCharacterId,
  characterIgdbId,
}: CharacterFormTabContentProps) {
  const renderTab = () => {
    switch (activeTab) {
      case "general":
        return <CharacterFormGeneralTab form={form} t={t} mode={mode} />;
      case "images":
        return <CharacterFormImagesTab form={form} t={t} />;
      case "translations":
        return <CharacterFormTranslationsTab form={form} t={t} />;
      case "roles":
        return <CharacterFormRolesTab form={form} t={t} availableRoles={availableRoles} />;
      case "games":
        return <CharacterFormGamesTab form={form} t={t} availableGames={availableGames} />;
      case "relationships":
        return (
          <CharacterFormRelationsTab
            form={form}
            t={t}
            availableCharacters={availableCharacters}
            currentCharacterId={currentCharacterId}
          />
        );
      case "screenshots":
        return <CharacterFormScreenshotsTab form={form} t={t} />;
      case "artwork":
        return <CharacterFormArtworkTab form={form} t={t} />;
      case "videos":
        return <CharacterFormVideosTab form={form} t={t} />;
      case "gender":
        return <CharacterFormGenderTab form={form} t={t} />;
      case "species":
        return <CharacterFormSpeciesTab form={form} t={t} />;
      case "sync":
        return currentCharacterId ? (
          <CharacterFormSyncTab characterId={currentCharacterId} igdbId={characterIgdbId ?? null} />
        ) : null;
      default:
        return null;
    }
  };

  return <Suspense fallback={<TabFallback />}>{renderTab()}</Suspense>;
}
