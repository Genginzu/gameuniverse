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
import type { AdminComment } from "@/types/admin-comments";

export interface DeleteCommentDialogProps {
  comment: AdminComment | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteCommentDialog({
  comment,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteCommentDialogProps) {
  const t = useTranslations("admin.comments.deleteDialog");

  const playerName = comment?.playerName ?? "";
  const characterName = comment?.characterName ?? "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("warning", { player: playerName, character: characterName })}
          </DialogDescription>
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
