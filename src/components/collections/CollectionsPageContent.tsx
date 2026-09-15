"use client";

/**
 * CollectionsPageContent : page des collections d'un joueur
 * (`/players/[id]/collections`) au look éditorial dark.
 *
 * Affiche les collections de `playerId` (vue propriétaire ou visiteur).
 * Logique métier inchangée :
 *   - `useCollections(playerId)` pour la liste
 *   - `useCollectionMutations` pour la création (propriétaire uniquement)
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { Link } from "@/i18n/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

import { CollectionCardEditorial } from "./CollectionCardEditorial";
import { CollectionForm } from "./CollectionForm";
import { CollectionsPageSkeleton } from "./CollectionsPageSkeleton";

import { useCollections } from "@/hooks/useCollections";
import { useCollectionMutations } from "@/hooks/useCollectionMutations";
import { useAuth } from "@/hooks/useAuth";

interface CollectionsPageContentProps {
  playerId: string;
  locale: string;
}

export function CollectionsPageContent({ playerId, locale }: CollectionsPageContentProps) {
  const t = useTranslations("collections.page");
  const tList = useTranslations("collections.list");
  const { user } = useAuth();
  const isOwner = user?.id === playerId;

  const { collections, isLoading, error, refetch } = useCollections(playerId);
  const { createCollection } = useCollectionMutations({
    playerId,
    refetchCollections: refetch,
  });

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (data: Record<string, unknown>) => {
    setIsCreating(true);
    try {
      await createCollection(data as { name: string; description?: string; isPublic?: boolean });
      setShowCreateDialog(false);
    } finally {
      setIsCreating(false);
    }
  };

  if (error) {
    return (
      <ErrorFallback
        title={t("errorTitle")}
        description={t("errorDescription")}
        showRefresh
        showBackButton
        backUrl={`/players/${playerId}`}
        backLabel={t("backToPlayer")}
        locale={locale}
      />
    );
  }

  if (isLoading) {
    return <CollectionsPageSkeleton />;
  }

  const basePath = `/players/${playerId}/collections`;

  return (
    <section className="w-full">
      <div className="mx-auto max-w-[1536px] px-4 pt-8 pb-16 md:px-8 md:pt-12 md:pb-20">
        {/* Header */}
        <header className="mb-10">
          <Link
            href={`/players/${playerId}`}
            className="text-editorial-muted inline-flex items-center gap-1.5 text-sm transition-colors hover:text-white"
          >
            <Icon icon="lucide:arrow-left" className="h-4 w-4" aria-hidden="true" />
            {t("backToPlayer")}
          </Link>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <KickerLabel>{t("kicker")}</KickerLabel>
              <h1 className="mt-2 font-display text-[clamp(2rem,4vw+1rem,3.5rem)] leading-[1.05] font-bold tracking-tight text-white">
                {t("title")}
              </h1>
            </div>

            {isOwner && (
              <button
                type="button"
                onClick={() => setShowCreateDialog(true)}
                className="bg-editorial-accent inline-flex h-14 items-center gap-2 self-start rounded-[14px] px-6 text-[0.95rem] font-semibold text-[#0a0418] transition hover:-translate-y-px hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[rgb(var(--accent-rgb,var(--neon-primary)))] sm:self-auto"
              >
                <Icon icon="lucide:plus" className="h-4 w-4" aria-hidden="true" />
                {t("createButton")}
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        {collections.length === 0 ? (
          <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center gap-5 rounded-3xl border px-8 py-16 text-center">
            <div className="bg-editorial-accent/15 text-editorial-accent grid size-16 place-items-center rounded-full">
              <Icon icon="lucide:layers" className="h-7 w-7" aria-hidden="true" />
            </div>
            <h3 className="font-display text-2xl font-bold text-white">{tList("emptyTitle")}</h3>
            <p className="text-editorial-muted max-w-[50ch]">{tList("emptyDescription")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 min-[475px]:grid-cols-2 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
            {collections.map((collection) => (
              <CollectionCardEditorial
                key={collection.id}
                collection={collection}
                basePath={basePath}
                showVisibility={isOwner}
              />
            ))}
          </div>
        )}

        {/* Create dialog */}
        {isOwner && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="border-editorial-line bg-editorial-2 text-white">
              <DialogHeader>
                <DialogTitle className="font-display text-white">{t("createButton")}</DialogTitle>
              </DialogHeader>
              <CollectionForm mode="create" onSubmit={handleCreate} isSubmitting={isCreating} />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </section>
  );
}
