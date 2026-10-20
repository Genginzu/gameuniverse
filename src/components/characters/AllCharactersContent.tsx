"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { Button } from "@/components/ui/button";
import { EntityCard } from "@/components/shared/EntityCard";
import { CharacterFilters } from "./CharacterFilters";
import { characterEditorialCardConfig } from "./characterEditorialCardConfig";
import { FilterButton } from "@/components/shared/FilterButton";
import { Pagination } from "@/components/shared/Pagination";
import { GridSkeleton } from "@/components/shared/GridSkeleton";
import { characterSkeletonConfig } from "@/components/shared/EntitySkeleton";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";
import { CharacterFavoriteStatusProvider } from "@/components/providers/CharacterFavoriteStatusProvider";
import { useCharacterFilters } from "@/hooks/useCharacterFilters";
import { useListingQuery } from "@/hooks/useListingQuery";
import { charactersListing } from "@/lib/listing/resources/characters";
import type { CharactersApiResponse } from "@/types/character";

interface AllCharactersContentProps {
  locale?: string;
  initialData?: CharactersApiResponse;
}

const GRID =
  "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5 xl:grid-cols-6";

export function AllCharactersContent({ locale = "fr", initialData }: AllCharactersContentProps) {
  const t = useTranslations("characters");
  const [showFilters, setShowFilters] = useState(false);

  const { filters, setFilters, resetFilters, setPage, data, isLoading, isValidating } =
    useListingQuery(charactersListing, { locale, fallbackData: initialData });
  const { roles, platforms } = useCharacterFilters(locale);

  const characters = useMemo(() => data?.characters ?? [], [data]);
  const pagination = data?.pagination ?? null;
  const characterSlugs = useMemo(() => characters.map((c) => c.slug), [characters]);

  const initialLoading = isLoading && characters.length === 0;
  const filterCount = filters.roles.length + filters.platforms.length;
  const hasFilters = filterCount > 0;

  return (
    <section className="w-full">
      <EditorialContainer>
        <header className="mb-10 flex flex-col gap-3">
          <KickerLabel>{t("title")}</KickerLabel>
          <h1 className="font-display text-[clamp(2rem,4vw+1rem,3.5rem)] leading-[1.05] font-bold tracking-tight text-white">
            {t("heroTitle")}{" "}
            <span className="text-editorial-accent">{t("heroTitleHighlight")}</span>
          </h1>
          <p className="text-editorial-muted flex flex-wrap items-baseline gap-5 text-sm">
            <span>{t("heroSubtitle")}</span>
            {pagination && (
              <>
                <span>·</span>
                <span className="text-editorial-accent font-mono">
                  {t("availableCount", { count: pagination.totalCount })}
                </span>
              </>
            )}
          </p>
        </header>

        <div className="mb-6 space-y-4">
          <FilterButton
            hasFilters={hasFilters}
            filterCount={filterCount}
            onClick={() => setShowFilters((v) => !v)}
          />
          <CharacterFilters
            selectedRoles={filters.roles}
            selectedPlatforms={filters.platforms}
            roles={roles}
            platforms={platforms}
            onRoleChange={(next) => setFilters({ roles: next })}
            onPlatformsChange={(next) => setFilters({ platforms: next })}
            onClearFilters={resetFilters}
            showAllFilters={showFilters}
            variant="editorial"
          />
        </div>

        {initialLoading ? (
          <GridSkeleton skeletonConfig={characterSkeletonConfig} count={20} gridClassName={GRID} />
        ) : characters.length === 0 ? (
          <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center gap-5 rounded-3xl border px-8 py-16 text-center">
            <div className="bg-editorial-accent/15 text-editorial-accent grid size-16 place-items-center rounded-full">
              <Icon icon="lucide:user" className="h-7 w-7" />
            </div>
            <h3 className="font-display text-2xl font-bold text-white">{t("empty.title")}</h3>
            <p className="text-editorial-muted max-w-[50ch]">
              {hasFilters ? t("empty.description") : t("empty.noCharacters")}
            </p>
            {hasFilters && <Button onClick={resetFilters}>{t("empty.clearFilters")}</Button>}
          </div>
        ) : (
          <CharacterFavoriteStatusProvider slugs={characterSlugs}>
            <div
              className="transition-opacity duration-200 data-[revalidating=true]:opacity-50"
              data-revalidating={isValidating && !isLoading ? "true" : "false"}
            >
              <div className={GRID}>
                {characters.map((character, index) => (
                  <EntityCard
                    key={character.id}
                    entity={character}
                    config={characterEditorialCardConfig}
                    locale={locale}
                    priority={index < 6}
                  />
                ))}
              </div>
            </div>
          </CharacterFavoriteStatusProvider>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-12">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              onPageChange={setPage}
              loading={isValidating}
              translationNamespace="characters.pagination"
              variant="editorial"
            />
          </div>
        )}
      </EditorialContainer>
    </section>
  );
}
