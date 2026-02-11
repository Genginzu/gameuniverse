"use client";

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
import type { AdminGame } from "@/types/admin-games";

export interface DeleteGameDialogProps {
  game: AdminGame | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteGameDialog({
  game,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteGameDialogProps) {
  const t = useTranslations("admin.games.deleteDialog");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("warning", { title: game?.title ?? "" })}</DialogDescription>
        </DialogHeader>
        <p className="text-sm font-medium text-destructive">{t("irreversible")}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            {t("cancel")}
          </Button>
          <LoadingButton
            variant="destructive"
            onClick={onConfirm}
            loading={isDeleting}
            loadingText={t("deleting")}
          >
            {t("confirm")}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
