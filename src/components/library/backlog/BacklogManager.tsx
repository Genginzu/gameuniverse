"use client";

import { useCallback } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { useAuth } from "@/hooks/useAuth";
import { useBacklog } from "@/hooks/useBacklog";
import type { BacklogFilters as Filters } from "@/types/backlog";

import { BacklogFilters } from "./BacklogFilters";
import { BacklogList } from "./BacklogList";
import { BacklogSkeleton } from "./BacklogSkeleton";
import { BacklogTimeSummary } from "./BacklogTimeSummary";
import { PlayNextSection } from "./PlayNextSection";

interface BacklogManagerProps {
  locale: string;
}

/** Top-level client component for the `/library/backlog` page. */
export function BacklogManager({ locale }: BacklogManagerProps) {
  const t = useTranslations("userLibrary.backlog");
  const { user, loading: authLoading } = useAuth();
  const {
    filteredGames,
    timeSummary,
    suggestions,
    availableGenres,
    availablePlatforms,
    filters,
    setFilters,
    hasActiveFilters,
    clearFilters,
    suggestionContext,
    setSuggestionContext,
    loading,
    reorder,
  } = useBacklog();

  // Keep the suggestion engine's preferred genres in sync with the genre filter.
  const handleFiltersChange = useCallback(
    (next: Filters) => {
      setFilters(next);
      setSuggestionContext((ctx) => ({ ...ctx, preferredGenreIds: next.genreIds }));
    },
    [setFilters, setSuggestionContext]
  );

  const handleClear = useCallback(() => {
    clearFilters();
    setSuggestionContext((ctx) => ({ ...ctx, preferredGenreIds: [] }));
  }, [clearFilters, setSuggestionContext]);

  return (
    <section className="w-full">
      <div className="mx-auto max-w-[1536px] px-4 pt-8 pb-16 md:px-8 md:pt-12 md:pb-20">
        <header className="mb-10">
          <div className="flex items-center gap-3">
            <Link
              href="/library"
              className="text-editorial-muted hover:text-white inline-flex items-center gap-1 text-sm"
            >
              <Icon icon="lucide:arrow-left" className="h-4 w-4" />
              {t("backToLibrary")}
            </Link>
          </div>
          <KickerLabel className="mt-4">{t("kicker")}</KickerLabel>
          <h1 className="mt-2 font-display text-[clamp(1.75rem,3vw+1rem,3rem)] leading-[1.05] font-bold tracking-tight text-white">
            {t("titlePrefix")} <span className="text-editorial-accent">{t("titleAccent")}</span>
          </h1>
          <p className="text-editorial-muted mt-3 max-w-[60ch] text-base">{t("subtitle")}</p>
        </header>

        {authLoading ? (
          <BacklogSkeleton />
        ) : !user ? (
          <AuthRequired />
        ) : loading ? (
          <BacklogSkeleton />
        ) : filteredGames.length === 0 && !hasActiveFilters ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-6">
            <PlayNextSection
              suggestions={suggestions}
              context={suggestionContext}
              locale={locale}
              onContextChange={setSuggestionContext}
            />

            <BacklogTimeSummary summary={timeSummary} locale={locale} />

            <BacklogFilters
              filters={filters}
              genres={availableGenres}
              platforms={availablePlatforms}
              hasActiveFilters={hasActiveFilters}
              onChange={handleFiltersChange}
              onClear={handleClear}
            />

            {filteredGames.length > 0 ? (
              <div>
                <p className="text-editorial-muted mb-3 flex items-center gap-2 text-sm">
                  <Icon icon="lucide:move-vertical" className="h-4 w-4" />
                  {t("reorderHint")}
                </p>
                <BacklogList
                  games={filteredGames}
                  locale={locale}
                  onReorder={reorder}
                />
              </div>
            ) : (
              <NoResults onClear={handleClear} />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function AuthRequired() {
  const t = useTranslations("userLibrary.backlog");
  return (
    <div className="border-editorial-line bg-editorial-2 flex flex-col items-center gap-5 rounded-3xl border px-8 py-16 text-center">
      <div className="bg-editorial-accent/15 text-editorial-accent grid size-16 place-items-center rounded-full">
        <Icon icon="lucide:lock" className="h-7 w-7" />
      </div>
      <h3 className="font-display text-2xl font-bold text-white">{t("authRequired.title")}</h3>
      <p className="text-editorial-muted max-w-[50ch]">{t("authRequired.description")}</p>
      <Button asChild>
        <Link href="/auth">
          <Icon icon="lucide:log-in" className="mr-2 h-4 w-4" />
          {t("authRequired.signIn")}
        </Link>
      </Button>
    </div>
  );
}

function EmptyState() {
  const t = useTranslations("userLibrary.backlog");
  return (
    <div className="border-editorial-line bg-editorial-2 flex flex-col items-center gap-5 rounded-3xl border px-8 py-16 text-center">
      <div className="bg-editorial-accent/15 text-editorial-accent grid size-16 place-items-center rounded-full">
        <Icon icon="lucide:list-checks" className="h-7 w-7" />
      </div>
      <h3 className="font-display text-2xl font-bold text-white">{t("empty.title")}</h3>
      <p className="text-editorial-muted max-w-[50ch]">{t("empty.description")}</p>
      <Button asChild>
        <Link href="/games">
          <Icon icon="lucide:plus" className="mr-2 h-4 w-4" />
          {t("empty.exploreGames")}
        </Link>
      </Button>
    </div>
  );
}

function NoResults({ onClear }: { onClear: () => void }) {
  const t = useTranslations("userLibrary.backlog");
  return (
    <div className="border-editorial-line bg-editorial-2 flex flex-col items-center gap-4 rounded-2xl border px-8 py-12 text-center">
      <p className="text-editorial-muted">{t("noResults")}</p>
      <Button onClick={onClear}>{t("filters.clear")}</Button>
    </div>
  );
}
