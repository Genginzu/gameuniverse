"use client";

/**
 * CollectionDetailEditorial : page Collection detail (`/collections/[slug]`)
 * au look éditorial. Conserve la logique métier :
 *   - Hook `useCollectionDetail` (fetch via slug)
 *   - Hook `useCollectionMutations` (edit / delete / toggle visibility / add game)
 *
 * Orchestration : la coquille visuelle est déléguée à `CollectionDetailHero`
 * (en-tête) et `CollectionDetailDialogs` (dialogs owner).
 * Style : Tailwind inline + tokens éditoriaux.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { KickerLabel } from "@/components/shared/KickerLabel";

import { useAuth } from "@/hooks/useAuth";
import { useCollectionDetail } from "@/hooks/useCollectionDetail";
import { useCollectionMutations } from "@/hooks/useCollectionMutations";
import { toast } from "@/hooks/use-toast";

import type { CollectionItem } from "@/types/collection";

import { CollectionDetailEditorialSkeleton } from "./CollectionDetailEditorialSkeleton";
import { CollectionDetailHero } from "./CollectionDetailHero";
import { CollectionDetailDialogs } from "./CollectionDetailDialogs";
import { CollectionGameCardEditorial } from "./CollectionGameCardEditorial";

interface CollectionDetailEditorialProps {
  slug: string;
  locale: string;
}

export function CollectionDetailEditorial({ slug, locale }: CollectionDetailEditorialProps) {
  const t = useTranslations("collections.editorial.detail");
  const tPage = useTranslations("collections.page");
  const tActions = useTranslations("collections.actions");
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const playerId = user?.id ?? "";

  const { collection, isLoading, error, notFound, refetch } = useCollectionDetail(playerId, slug);

  const { updateCollection, deleteCollection, toggleVisibility, addItem, removeItem } =
    useCollectionMutations({
      playerId,
      refetchDetail: refetch,
    });

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddGameDialog, setShowAddGameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<CollectionItem | null>(null);
  const [isRemovingItem, setIsRemovingItem] = useState(false);

  if (authLoading || isLoading) return <CollectionDetailEditorialSkeleton />;

  if (!user) {
    return (
      <ErrorFallback
        title={t("authRequiredTitle")}
        description={t("authRequiredDescription")}
        showRefresh={false}
        showHomeButton
      />
    );
  }

  if (notFound) {
    return (
      <ErrorFallback
        title={tPage("notFoundTitle")}
        description={tPage("notFoundDescription")}
        showRefresh={false}
        showBackButton
        backUrl="/collections"
        backLabel={tPage("backToCollections")}
        locale={locale}
      />
    );
  }

  if (error || !collection) {
    return (
      <ErrorFallback
        title={tPage("errorTitle")}
        description={tPage("errorDescription")}
        showRefresh
        showBackButton
        backUrl="/collections"
        backLabel={tPage("backToCollections")}
        locale={locale}
      />
    );
  }

  const isOwner = user.id === collection.userId;
  const sortedItems = [...collection.items].sort((a, b) => a.position - b.position);

  const handleEdit = async (data: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      await updateCollection(
        slug,
        data as { name?: string; description?: string; isPublic?: boolean; coverImageUrl?: string }
      );
      setShowEditDialog(false);
      toast({ title: tPage("updateSuccess") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCollection(slug);
      toast({ title: tPage("deleteSuccess") });
      router.push("/collections");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleToggleVisibility = async () => {
    await toggleVisibility(slug, collection.isPublic);
  };

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/${locale}/players/${collection.userId}/collections/${collection.slug}`;
    await navigator.clipboard.writeText(shareUrl);
    toast({ title: tActions("linkCopied"), description: tActions("linkCopiedDescription") });
  };

  const handleAddGame = async (input: { gameId: string; note?: string }) => {
    setIsAddingGame(true);
    try {
      await addItem(slug, input);
      setShowAddGameDialog(false);
      toast({ title: tPage("addGameSuccess") });
    } finally {
      setIsAddingGame(false);
    }
  };

  const handleConfirmRemoveItem = async () => {
    if (!itemToRemove) return;
    setIsRemovingItem(true);
    try {
      await removeItem(slug, itemToRemove.gameId);
      toast({ title: t("removeItem.successToast") });
      setItemToRemove(null);
    } finally {
      setIsRemovingItem(false);
    }
  };

  const updatedAtFormatted = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(collection.updatedAt));

  return (
    <section className="w-full">
      <div className="mx-auto max-w-[1536px] px-4 pt-6 pb-16 md:px-8 md:pt-10 md:pb-20">
        <Link
          href="/collections"
          className="text-editorial-muted hover:text-editorial-accent mb-6 inline-flex items-center gap-1.5 font-mono text-[0.7rem] font-semibold tracking-[0.14em] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[rgb(var(--accent-rgb,var(--neon-primary)))]"
        >
          <Icon icon="lucide:arrow-left" className="h-3.5 w-3.5" aria-hidden="true" />
          {tPage("backToCollections")}
        </Link>

        <CollectionDetailHero
          collection={collection}
          items={sortedItems}
          isOwner={isOwner}
          updatedAtFormatted={updatedAtFormatted}
          locale={locale}
          onAddGame={() => setShowAddGameDialog(true)}
          onEdit={() => setShowEditDialog(true)}
          onToggleVisibility={handleToggleVisibility}
          onCopyLink={handleCopyLink}
          onDelete={() => setShowDeleteDialog(true)}
        />

        {/* Games */}
        <section>
          <header className="mb-6 flex items-end justify-between gap-4">
            <div>
              <KickerLabel>{t("gamesKicker")}</KickerLabel>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white">
                {t("gamesTitle")}
              </h2>
            </div>
          </header>

          {sortedItems.length === 0 ? (
            <CollectionDetailEmptyState isOwner={isOwner} onAdd={() => setShowAddGameDialog(true)} />
          ) : (
            <div className="grid grid-cols-2 gap-4 min-[475px]:grid-cols-3 md:grid-cols-4 md:gap-5 lg:grid-cols-5 xl:grid-cols-6 min-[1536px]:grid-cols-7">
              {sortedItems.map((item) => (
                <CollectionGameCardEditorial
                  key={item.id}
                  item={item}
                  onRemove={isOwner ? () => setItemToRemove(item) : undefined}
                />
              ))}
            </div>
          )}
        </section>

        {isOwner && (
          <CollectionDetailDialogs
            collection={collection}
            showEditDialog={showEditDialog}
            setShowEditDialog={setShowEditDialog}
            showAddGameDialog={showAddGameDialog}
            setShowAddGameDialog={setShowAddGameDialog}
            showDeleteDialog={showDeleteDialog}
            setShowDeleteDialog={setShowDeleteDialog}
            itemToRemove={itemToRemove}
            setItemToRemove={setItemToRemove}
            isSubmitting={isSubmitting}
            isAddingGame={isAddingGame}
            isDeleting={isDeleting}
            isRemovingItem={isRemovingItem}
            onEdit={handleEdit}
            onAddGame={handleAddGame}
            onDelete={handleDelete}
            onConfirmRemoveItem={handleConfirmRemoveItem}
          />
        )}
      </div>
    </section>
  );
}

function CollectionDetailEmptyState({ isOwner, onAdd }: { isOwner: boolean; onAdd: () => void }) {
  const t = useTranslations("collections.editorial.detail");

  return (
    <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center gap-5 rounded-3xl border border-dashed px-8 py-16 text-center">
      <div className="bg-editorial-accent/15 text-editorial-accent grid size-16 place-items-center rounded-full">
        <Icon icon="lucide:gamepad-2" className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="font-display text-2xl font-bold text-white">{t("emptyTitle")}</h3>
      <p className="text-editorial-muted max-w-[50ch]">
        {isOwner ? t("emptyDescriptionOwner") : t("emptyDescriptionViewer")}
      </p>
      {isOwner && (
        <Button onClick={onAdd}>
          <Icon icon="lucide:plus" className="mr-2 h-4 w-4" aria-hidden="true" />
          {t("emptyCta")}
        </Button>
      )}
    </div>
  );
}
