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
import type { AdminRating } from "@/types/admin-age-classifications";

export interface DeleteRatingDialogProps {
  rating: AdminRating | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  usageCount?: number;
}

export function DeleteRatingDialog({
  rating,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  usageCount,
}: DeleteRatingDialogProps) {
  const hasUsage = usageCount !== null && usageCount !== undefined && usageCount > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer la note</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer la note « {rating?.display_name ?? ""} » ?
          </DialogDescription>
        </DialogHeader>

        {hasUsage && (
          <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
            Cette note est associée à {usageCount} jeu{(usageCount ?? 0) > 1 ? "x" : ""}. Elle ne
            peut pas être supprimée tant que ces associations existent.
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
