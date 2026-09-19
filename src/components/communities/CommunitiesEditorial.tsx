"use client";

/**
 * CommunitiesEditorial : page listing des communautés thématiques
 * (`/communities`) au look éditorial. Recherche par nom, création.
 */

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { useSearchParams } from "next/navigation";

import { KickerLabel } from "@/components/shared/KickerLabel";
import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";

import { useAuth } from "@/hooks/useAuth";
import { useCommunities } from "@/hooks/useCommunities";
import { CommunityService } from "@/lib/services/communityService";
import type { CreateCommunityInput } from "@/lib/validations/community";

import { CommunitiesGrid } from "./CommunitiesGrid";
import { CreateCommunityDialog } from "./CreateCommunityDialog";

export function CommunitiesEditorial() {
  const t = useTranslations("communities.editorial");
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { communities, isLoading, error, refetch } = useCommunities({ search: search || undefined });

  // Ouvre automatiquement le dialog de création via ?create=1 (ex: lien sidebar).
  useEffect(() => {
    if (user && searchParams.get("create") === "1") {
      setIsDialogOpen(true);
    }
  }, [user, searchParams]);

  const handleCreate = async (data: CreateCommunityInput) => {
    setIsCreating(true);
    try {
      const created = await CommunityService.createCommunity(data);
      setIsDialogOpen(false);
      await refetch();
      window.location.href = `/communities/${created.slug}`;
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="w-full">
      <EditorialContainer>
        <header className="mb-10 grid grid-cols-1 gap-4 lg:grid-cols-[5fr_7fr] lg:items-end lg:gap-12">
          <div>
            <KickerLabel>{t("kicker")}</KickerLabel>
            <h1 className="mt-2 font-display text-[clamp(2rem,4vw+1rem,3.5rem)] leading-[1.05] font-bold tracking-tight text-white">
              {t("titlePrefix")} <span className="text-editorial-accent">{t("titleAccent")}</span>
            </h1>
            <p className="text-editorial-muted mt-4 max-w-[60ch] text-base">{t("subtitle")}</p>
          </div>
        </header>

        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Icon
              icon="lucide:search"
              className="text-editorial-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="border-editorial-line bg-editorial-3 text-base text-white placeholder:text-editorial-muted focus-visible:border-[rgba(var(--accent-rgb,var(--neon-primary)),0.5)] h-12 w-full rounded-[14px] border pl-10 pr-4 outline-none"
            />
          </div>

          {user && (
            <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              className="bg-editorial-accent inline-flex h-14 items-center justify-center gap-2 rounded-[14px] px-6 text-[0.95rem] font-semibold text-[#0a0418] transition hover:-translate-y-px hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[rgb(var(--accent-rgb,var(--neon-primary)))]"
            >
              <Icon icon="lucide:plus" className="h-4 w-4" aria-hidden="true" />
              {t("createButton")}
            </button>
          )}
        </div>

        {error ? (
          <p className="text-editorial-muted text-center">{t("errorLoading")}</p>
        ) : isLoading ? (
          <CommunitiesGridSkeleton />
        ) : communities.length === 0 ? (
          <CommunitiesEmptyState onCreate={user ? () => setIsDialogOpen(true) : undefined} />
        ) : (
          <CommunitiesGrid communities={communities} />
        )}

        {user && (
          <CreateCommunityDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onSubmit={handleCreate}
            isSubmitting={isCreating}
          />
        )}
      </EditorialContainer>
    </section>
  );
}

function CommunitiesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="border-editorial-line bg-editorial-2 aspect-[4/5] animate-pulse rounded-2xl border"
        />
      ))}
    </div>
  );
}

function CommunitiesEmptyState({ onCreate }: { onCreate?: () => void }) {
  const t = useTranslations("communities.editorial");

  return (
    <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center gap-5 rounded-3xl border px-8 py-16 text-center">
      <div className="bg-editorial-accent/15 text-editorial-accent grid size-16 place-items-center rounded-full">
        <Icon icon="lucide:globe-2" className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="font-display text-2xl font-bold text-white">{t("empty.title")}</h3>
      <p className="text-editorial-muted max-w-[50ch]">{t("empty.description")}</p>
      {onCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="bg-editorial-accent inline-flex h-12 items-center justify-center gap-2 rounded-[14px] px-6 text-sm font-semibold text-[#0a0418] transition hover:-translate-y-px hover:brightness-110"
        >
          <Icon icon="lucide:plus" className="h-4 w-4" aria-hidden="true" />
          {t("empty.cta")}
        </button>
      )}
    </div>
  );
}
