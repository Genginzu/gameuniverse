"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

import { SearchInputField } from "@/components/games/SearchInputField";
import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";
import { EmptyState } from "@/components/shared/EmptyState";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useListingQuery } from "@/hooks/useListingQuery";
import { franchisesListing } from "@/lib/listing/resources/franchises";
import type { FranchisesApiResponse } from "@/types/franchise";

import { FranchiseCard } from "./FranchiseCard";
import { FRANCHISE_CARD_SKELETON, FRANCHISES_GRID } from "./franchisesGrid";

const Pagination = dynamic(() =>
  import("@/components/shared/Pagination").then((m) => m.Pagination)
);

interface FranchisesListingProps {
  initialData?: FranchisesApiResponse;
}

/** `/franchises`: searchable grid of franchises and IGDB collections. */
export function FranchisesListing({ initialData }: FranchisesListingProps) {
  const t = useTranslations("franchises");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const { filters, setFilters, setPage, data, isLoading, isValidating } = useListingQuery(
    franchisesListing,
    { fallbackData: initialData }
  );

  useEffect(() => {
    if (debouncedQuery.trim() !== filters.search) setFilters({ search: debouncedQuery.trim() });
  }, [debouncedQuery, filters.search, setFilters]);

  const franchises = data?.franchises ?? [];
  const pagination = data?.pagination;

  return (
    <EditorialContainer>
      <header className="mb-8 flex flex-col gap-3 md:mb-10">
        <KickerLabel>{t("kicker")}</KickerLabel>
        <h1 className="font-display text-[clamp(2rem,4vw+1rem,3.5rem)] leading-[1.05] font-bold tracking-tight text-white">
          {t("title")}
        </h1>
        <p className="text-editorial-muted text-sm sm:text-base">
          {t("description")}
          {pagination && (
            <span className="text-editorial-accent ml-3 font-mono">
              {t("count", { count: pagination.totalCount })}
            </span>
          )}
        </p>
      </header>

      <div className="mb-6 max-w-xl">
        <SearchInputField
          value={query}
          onChange={setQuery}
          onSubmit={() => setFilters({ search: query.trim() })}
          onClear={() => setQuery("")}
          placeholder={t("searchPlaceholder")}
          variant="editorial"
        />
      </div>

      <div
        className="transition-opacity duration-200 data-[revalidating=true]:opacity-50 motion-reduce:transition-none"
        data-revalidating={isValidating && !isLoading ? "true" : "false"}
      >
        {isLoading && franchises.length === 0 ? (
          <div className={FRANCHISES_GRID}>
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className={FRANCHISE_CARD_SKELETON} />
            ))}
          </div>
        ) : franchises.length === 0 ? (
          <EmptyState
            icon="lucide:library-big"
            title={t("emptyTitle")}
            description={t("emptyDescription")}
          />
        ) : (
          <div className={FRANCHISES_GRID}>
            {franchises.map((franchise) => (
              <FranchiseCard key={`${franchise.kind}-${franchise.id}`} franchise={franchise} />
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-12">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              onPageChange={setPage}
              loading={isValidating}
              translationNamespace="pagination"
              variant="editorial"
            />
          </div>
        )}
      </div>
    </EditorialContainer>
  );
}
