"use client";

/**
 * CollectionDetailDialogs : les 4 dialogs owner de la page Collection detail
 * (édition, ajout de jeu, suppression de collection, retrait d'un item).
 *
 * Extrait de CollectionDetailEditorial pour respecter la limite de taille.
 */

import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";

import type { CollectionDetail, CollectionItem } from "@/types/collection";

import { CollectionForm } from "./CollectionForm";
import { AddGameToCollection } from "./AddGameToCollection";

interface CollectionDetailDialogsProps {
  collection: CollectionDetail;
  showEditDialog: boolean;
  setShowEditDialog: (open: boolean) => void;
  showAddGameDialog: boolean;
  setShowAddGameDialog: (open: boolean) => void;
  showDeleteDialog: boolean;
  setShowDeleteDialog: (open: boolean) => void;
  itemToRemove: CollectionItem | null;
  setItemToRemove: (item: CollectionItem | null) => void;
  isSubmitting: boolean;
  isAddingGame: boolean;
  isDeleting: boolean;
  isRemovingItem: boolean;
  onEdit: (data: Record<string, unknown>) => Promise<void>;
  onAddGame: (input: { gameId: string; note?: string }) => Promise<void>;
  onDelete: () => void;
  onConfirmRemoveItem: () => void;
}

export function CollectionDetailDialogs({
  collection,
  showEditDialog,
  setShowEditDialog,
  showAddGameDialog,
  setShowAddGameDialog,
  showDeleteDialog,
  setShowDeleteDialog,
  itemToRemove,
  setItemToRemove,
  isSubmitting,
  isAddingGame,
  isDeleting,
  isRemovingItem,
  onEdit,
  onAddGame,
  onDelete,
  onConfirmRemoveItem,
}: CollectionDetailDialogsProps) {
  const t = useTranslations("collections.editorial.detail");
  const tPage = useTranslations("collections.page");
  const tActions = useTranslations("collections.actions");

  return (
    <>
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tPage("editCollection")}</DialogTitle>
          </DialogHeader>
          <CollectionForm
            mode="edit"
            defaultValues={{
              name: collection.name,
              description: collection.description ?? "",
              isPublic: collection.isPublic,
              coverImageUrl: collection.coverImageUrl ?? "",
            }}
            onSubmit={onEdit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showAddGameDialog} onOpenChange={setShowAddGameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tPage("addGame")}</DialogTitle>
          </DialogHeader>
          <AddGameToCollection onAdd={onAddGame} isAdding={isAddingGame} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => !open && !isDeleting && setShowDeleteDialog(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tActions("deleteTitle")}</DialogTitle>
            <DialogDescription>
              {tActions("deleteDescription", { name: collection.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              {tActions("deleteCancel")}
            </Button>
            <LoadingButton
              variant="destructive"
              onClick={onDelete}
              loading={isDeleting}
              loadingText={tActions("deleting")}
            >
              {tActions("deleteConfirm")}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={itemToRemove !== null}
        onOpenChange={(open) => !open && !isRemovingItem && setItemToRemove(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("removeItem.confirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("removeItem.confirmDescription", { title: itemToRemove?.title ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemToRemove(null)} disabled={isRemovingItem}>
              {t("removeItem.confirmCancel")}
            </Button>
            <LoadingButton
              variant="destructive"
              onClick={onConfirmRemoveItem}
              loading={isRemovingItem}
              loadingText={t("removeItem.removing")}
            >
              {t("removeItem.confirmAction")}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
