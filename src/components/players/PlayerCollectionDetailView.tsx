"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CollectionDetail } from "@/components/collections/CollectionDetail";
import { CollectionActions } from "@/components/collections/CollectionActions";
import { CollectionForm } from "@/components/collections/CollectionForm";
import { AddGameToCollection } from "@/components/collections/AddGameToCollection";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollectionDetail } from "@/hooks/useCollectionDetail";
import { useCollectionMutations } from "@/hooks/useCollectionMutations";
import { toast } from "@/hooks/use-toast";

interface PlayerCollectionDetailViewProps {
  playerId: string;
  slug: string;
  locale: string;
  isOwner: boolean;
  onBack: () => void;
  onDeleted: () => void;
  refetchList: () => Promise<void>;
}

export function PlayerCollectionDetailView({
  playerId,
  slug,
  locale,
  isOwner,
  onBack,
  onDeleted,
  refetchList,
}: PlayerCollectionDetailViewProps) {
  const t = useTranslations("collections.page");
  const { collection, isLoading, error, notFound, refetch } = useCollectionDetail(playerId, slug);
  const { updateCollection, deleteCollection, toggleVisibility, addItem } = useCollectionMutations({
    playerId,
    refetchCollections: refetchList,
    refetchDetail: refetch,
  });

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddGameDialog, setShowAddGameDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingGame, setIsAddingGame] = useState(false);

  const handleEdit = async (data: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      await updateCollection(
        slug,
        data as { name?: string; description?: string; isPublic?: boolean; coverImageUrl?: string }
      );
      setShowEditDialog(false);
      toast({ title: t("updateSuccess") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    await deleteCollection(slug);
    toast({ title: t("deleteSuccess") });
    onDeleted();
  };

  const handleToggleVisibility = async () => {
    if (!collection) return;
    await toggleVisibility(slug, collection.isPublic);
  };

  const handleAddGame = async (input: { gameId: string; note?: string }) => {
    setIsAddingGame(true);
    try {
      await addItem(slug, input);
      setShowAddGameDialog(false);
      toast({ title: t("addGameSuccess") });
    } finally {
      setIsAddingGame(false);
    }
  };

  if (isLoading) {
    return (
      <section className="mb-8 space-y-4">
        <Skeleton className="h-8 w-32 bg-gray-200 dark:bg-slate-700" />
        <Skeleton className="h-48 w-full rounded-xl bg-gray-200 dark:bg-slate-700" />
      </section>
    );
  }

  if (notFound) {
    return (
      <section className="mb-8 space-y-4">
        <BackButton onBack={onBack} />
        <p className="py-8 text-center text-sm text-gray-500 dark:text-slate-400">
          {t("notFoundTitle")}
        </p>
      </section>
    );
  }

  if (error || !collection) {
    return (
      <section className="mb-8 space-y-4">
        <BackButton onBack={onBack} />
        <p className="py-8 text-center text-sm text-red-500 dark:text-red-400">{t("errorTitle")}</p>
      </section>
    );
  }

  return (
    <section className="mb-8 space-y-4">
      <BackButton onBack={onBack} />

      {/* Owner actions */}
      {isOwner && (
        <div className="flex flex-wrap items-center gap-2">
          <CollectionActions
            collection={collection}
            onEdit={() => setShowEditDialog(true)}
            onDelete={handleDelete}
            onToggleVisibility={handleToggleVisibility}
          />
          <Button variant="outline" size="sm" onClick={() => setShowAddGameDialog(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            {t("addGame")}
          </Button>
        </div>
      )}

      <CollectionDetail collection={collection} />

      {/* Edit dialog */}
      {isOwner && (
        <>
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("editCollection")}</DialogTitle>
              </DialogHeader>
              <CollectionForm
                mode="edit"
                defaultValues={{
                  name: collection.name,
                  description: collection.description ?? "",
                  isPublic: collection.isPublic,
                  coverImageUrl: collection.coverImageUrl ?? "",
                }}
                onSubmit={handleEdit}
                isSubmitting={isSubmitting}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={showAddGameDialog} onOpenChange={setShowAddGameDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("addGame")}</DialogTitle>
              </DialogHeader>
              <AddGameToCollection onAdd={handleAddGame} isAdding={isAddingGame} />
            </DialogContent>
          </Dialog>
        </>
      )}
    </section>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  const t = useTranslations("collections.page");

  return (
    <Button variant="ghost" size="sm" onClick={onBack}>
      <ArrowLeft className="mr-1.5 h-4 w-4" />
      {t("backToCollections")}
    </Button>
  );
}
