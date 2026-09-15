"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { CollectionItem } from "@/types/collection";
import { useCollectionDetail } from "@/hooks/useCollectionDetail";
import { useCollectionMutations } from "@/hooks/useCollectionMutations";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { CollectionDetailEditorialSkeleton } from "@/components/collections/CollectionDetailEditorialSkeleton";
import { CollectionDetailHero } from "@/components/collections/CollectionDetailHero";
import { CollectionDetailDialogs } from "@/components/collections/CollectionDetailDialogs";
import { CollectionGameCardEditorial } from "@/components/collections/CollectionGameCardEditorial";
import { EditItemNoteDialog } from "@/components/collections/EditItemNoteDialog";
import { CollectionAdvancedStatsSection } from "@/components/collections/stats/CollectionAdvancedStats";

interface PlayerCollectionDetailViewProps {
  playerId: string;
  slug: string;
  locale: string;
  isOwner: boolean;
  onBack: () => void;
  onDeleted: () => void;
  refetchList: () => Promise<void>;
}

/**
 * In-tab collection detail (profile "Collections" tab), editorial-themed.
 * Mirrors CollectionDetailEditorial but stays in-tab via onBack/onDeleted.
 */
export function PlayerCollectionDetailView({
  playerId,
  slug,
  locale: _locale,
  isOwner,
  onBack,
  onDeleted,
  refetchList,
}: PlayerCollectionDetailViewProps) {
  const locale = useLocale();
  const t = useTranslations("collections.editorial.detail");
  const tPage = useTranslations("collections.page");
  const tActions = useTranslations("collections.actions");

  const { collection, stats, isLoading, error, notFound, refetch } = useCollectionDetail(
    playerId,
    slug
  );
  const { updateCollection, deleteCollection, toggleVisibility, addItem, removeItem, updateItemNote } =
    useCollectionMutations({ playerId, refetchCollections: refetchList, refetchDetail: refetch });

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddGameDialog, setShowAddGameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<CollectionItem | null>(null);
  const [isRemovingItem, setIsRemovingItem] = useState(false);
  const [itemToEditNote, setItemToEditNote] = useState<CollectionItem | null>(null);
  const [isSavingNote, setIsSavingNote] = useState(false);

  if (isLoading) {
    return (
      <section className="mb-8 space-y-4">
        <BackLink onBack={onBack} label={tPage("backToCollections")} />
        <CollectionDetailEditorialSkeleton />
      </section>
    );
  }

  if (notFound) {
    return (
      <section className="mb-8 space-y-4">
        <BackLink onBack={onBack} label={tPage("backToCollections")} />
        <p className="text-editorial-muted py-8 text-center text-sm">{tPage("notFoundTitle")}</p>
      </section>
    );
  }

  if (error || !collection) {
    return (
      <section className="mb-8 space-y-4">
        <BackLink onBack={onBack} label={tPage("backToCollections")} />
        <p className="py-8 text-center text-sm text-red-400">{tPage("errorTitle")}</p>
      </section>
    );
  }

  const sortedItems = [...collection.items].sort((a, b) => a.position - b.position);
  const updatedAtFormatted = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(collection.updatedAt));

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
      onDeleted();
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleToggleVisibility = () => toggleVisibility(slug, collection.isPublic);

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
    } catch {
      toast({ title: t("removeItem.errorToast"), variant: "destructive" });
    } finally {
      setIsRemovingItem(false);
    }
  };

  const handleSaveNote = async (note: string) => {
    if (!itemToEditNote) return;
    setIsSavingNote(true);
    try {
      await updateItemNote(slug, itemToEditNote.gameId, note.trim() || null);
      toast({ title: t("editNote.successToast") });
      setItemToEditNote(null);
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <section className="mb-8">
      <BackLink onBack={onBack} label={tPage("backToCollections")} />

      <div className="mt-6">
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
      </div>

      <section>
        <KickerLabel>{t("gamesKicker")}</KickerLabel>
        <h2 className="mt-2 mb-6 font-display text-2xl font-bold tracking-tight text-white">
          {t("gamesTitle")}
        </h2>

        {sortedItems.length === 0 ? (
          <EmptyState
            isOwner={isOwner}
            onAdd={() => setShowAddGameDialog(true)}
            labels={{
              title: t("emptyTitle"),
              description: isOwner ? t("emptyDescriptionOwner") : t("emptyDescriptionViewer"),
              cta: t("emptyCta"),
            }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 min-[475px]:grid-cols-3 md:grid-cols-4 md:gap-5 lg:grid-cols-5 xl:grid-cols-6">
            {sortedItems.map((item) => (
              <CollectionGameCardEditorial
                key={item.id}
                item={item}
                onRemove={isOwner ? () => setItemToRemove(item) : undefined}
                onEditNote={isOwner ? () => setItemToEditNote(item) : undefined}
              />
            ))}
          </div>
        )}
      </section>

      {/* Advanced statistics — editorial surface is always dark without the
          `.dark` class, so scope it for correct contrast in light app theme. */}
      {stats && stats.totalGames > 0 && (
        <div className="dark mt-12">
          <CollectionAdvancedStatsSection stats={stats} />
        </div>
      )}

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

      {isOwner && (
        <EditItemNoteDialog
          item={itemToEditNote}
          isSaving={isSavingNote}
          onClose={() => setItemToEditNote(null)}
          onSave={handleSaveNote}
        />
      )}
    </section>
  );
}

function BackLink({ onBack, label }: { onBack: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="text-editorial-muted hover:text-editorial-accent inline-flex items-center gap-1.5 font-mono text-[0.7rem] font-semibold tracking-[0.14em] uppercase transition-colors"
    >
      <Icon icon="lucide:arrow-left" className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

function EmptyState({
  isOwner,
  onAdd,
  labels,
}: {
  isOwner: boolean;
  onAdd: () => void;
  labels: { title: string; description: string; cta: string };
}) {
  return (
    <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center gap-5 rounded-3xl border border-dashed px-8 py-16 text-center">
      <div className="bg-editorial-accent/15 text-editorial-accent grid size-16 place-items-center rounded-full">
        <Icon icon="lucide:gamepad-2" className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="font-display text-2xl font-bold text-white">{labels.title}</h3>
      <p className="text-editorial-muted max-w-[50ch]">{labels.description}</p>
      {isOwner && (
        <Button onClick={onAdd}>
          <Icon icon="lucide:plus" className="mr-2 h-4 w-4" aria-hidden="true" />
          {labels.cta}
        </Button>
      )}
    </div>
  );
}
