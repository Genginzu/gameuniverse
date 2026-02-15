"use client";

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
import type { AdminRatingSystem } from "@/types/admin-age-classifications";

export interface DeleteRatingSystemDialogProps {
  system: AdminRatingSystem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  usageCount?: number;
}

export function DeleteRatingSystemDialog({
  system,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  usageCount,
}: DeleteRatingSystemDialogProps) {
  const hasUsage = usageCount !== null && usageCount !== undefined && usageCount > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer le système de classification</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer le système « {system?.name ?? ""} » ?
          </DialogDescription>
        </DialogHeader>

        {hasUsage && (
          <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
            Ce système possède {usageCount} note{(usageCount ?? 0) > 1 ? "s" : ""} ou descripteur
            {(usageCount ?? 0) > 1 ? "s" : ""} associé
            {(usageCount ?? 0) > 1 ? "s" : ""}. Il ne peut pas être supprimé tant que ces éléments
            existent.
          </p>
        )}

        {!hasUsage && (
          <p className="text-sm font-medium text-destructive">Cette action est irréversible.</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Annuler
          </Button>
          {!hasUsage && (
            <LoadingButton
              variant="destructive"
              onClick={onConfirm}
              loading={isDeleting}
              loadingText="Suppression…"
            >
              Supprimer
            </LoadingButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
