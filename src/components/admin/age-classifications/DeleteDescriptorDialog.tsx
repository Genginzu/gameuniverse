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
import type { AdminContentDescriptor } from "@/types/admin-age-classifications";

export interface DeleteDescriptorDialogProps {
  descriptor: AdminContentDescriptor | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  usageCount?: number;
}

export function DeleteDescriptorDialog({
  descriptor,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  usageCount,
}: DeleteDescriptorDialogProps) {
  const hasUsage = usageCount !== null && usageCount !== undefined && usageCount > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer le descripteur</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer le descripteur « {descriptor?.code ?? ""} » ?
          </DialogDescription>
        </DialogHeader>

        {hasUsage && (
          <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
            Ce descripteur est associé à {usageCount} jeu{(usageCount ?? 0) > 1 ? "x" : ""}. Il ne
            peut pas être supprimé tant que ces associations existent.
          </p>
        )}

        {!hasUsage && (
          <p className="text-sm font-medium text-destructive">
            Cette action est irréversible. Les traductions associées seront également supprimées.
          </p>
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
