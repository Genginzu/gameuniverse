"use client";

import { type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { FaImage, FaSave } from "react-icons/fa";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";
import { SUPPORTED_LANGUAGES, type AdminGenre, type Tab, type TabId } from "@/types/admin-games";

/** Hero banner showing cover, title, slug and genres */
export function HeroBanner({
  form,
  genres,
  coverImageUrl,
  backgroundImageUrl,
  t,
}: {
  form: UseFormReturn<AdminGameFormData>;
  genres: AdminGenre[];
  coverImageUrl: string | undefined;
  backgroundImageUrl: string | undefined;
  t: (key: string) => string;
}) {
  return (
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
              <span className="ml-3">· {new Date(form.watch("release_date")!).getFullYear()}</span>
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
  );
}

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
              <FaSave className="h-4 w-4" />
              {mode === "create" ? t("create") : t("save")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
