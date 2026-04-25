"use client";

import { type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";
import { SUPPORTED_LANGUAGES, type Tab, type TabId } from "@/types/admin-games";
import { Icon } from "@iconify/react";

// Re-export HeroBanner from its own file for backward compatibility
export { HeroBanner } from "./GameFormHeroBanner";

/** Tab navigation bar with badges */
export function TabNavigation({
  tabs,
  activeTab,
  setActiveTab,
  form,
  tabLabel,
}: {
  tabs: Tab[];
  activeTab: TabId;
  setActiveTab: (id: TabId) => void;
  form: UseFormReturn<AdminGameFormData>;
  tabLabel: (tab: Tab) => string;
}) {
  const getBadge = (tabId: TabId): number | null => {
    switch (tabId) {
      case "genres":
        return form.watch("genres").length;
      case "companies":
        return form.watch("companies").length;
      case "translations":
        return SUPPORTED_LANGUAGES.length;
      case "images":
        return form.watch("screenshots").length + form.watch("artwork").length;
      case "age_ratings":
        return form.watch("age_ratings").length;
      case "versions":
        return form.watch("versions").length;
      case "languages":
        return form.watch("languages").length;
      case "pricing":
        return form.watch("prices").length;
      case "game_platforms":
        return form.watch("game_platforms").length;
      default:
        return null;
    }
  };

  return (
    <nav className="flex flex-wrap gap-1 rounded-xl border border-gray-200/60 bg-white p-1 shadow-xs dark:border-gray-700/40 dark:bg-gray-800/60">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const badge = getBadge(tab.id);
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all ${isActive ? "bg-primary text-primary-foreground shadow-xs" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-300"}`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tabLabel(tab)}</span>
            {badge !== null && badge > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold tabular-nums ${isActive ? "text-primary-foreground bg-white/20" : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"}`}
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
export function StickySubmitBar({
  tabs,
  activeTab,
  setActiveTab,
  isSubmitting,
  mode,
  t,
}: {
  tabs: Tab[];
  activeTab: TabId;
  setActiveTab: (id: TabId) => void;
  isSubmitting: boolean;
  mode: "create" | "edit";
  t: (key: string) => string;
}) {
  return (
    <div className="fixed right-0 bottom-0 left-0 z-20 border-t border-gray-200/60 bg-white/80 backdrop-blur-xl lg:left-64 dark:border-gray-700/40 dark:bg-gray-900/80">
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
              <Icon icon="fa:save" className="h-4 w-4" />
              {mode === "create" ? t("create") : t("save")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
