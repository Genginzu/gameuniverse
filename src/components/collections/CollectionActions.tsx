"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Pencil, Trash2, Eye, EyeOff, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import type { CollectionDetail } from "@/types/collection";

interface CollectionActionsProps {
  collection: CollectionDetail;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onToggleVisibility: () => Promise<void>;
}

export function CollectionActions({
  collection,
  onEdit,
  onDelete,
  onToggleVisibility,
}: CollectionActionsProps) {
  const t = useTranslations("collections.actions");
  const locale = useLocale();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/${locale}/players/${collection.userId}/collections/${collection.slug}`;
    await navigator.clipboard.writeText(shareUrl);
    toast({ title: t("linkCopied"), description: t("linkCopiedDescription") });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="mr-1.5 h-4 w-4" />
          {t("edit")}
        </Button>

        <Button variant="outline" size="sm" onClick={onToggleVisibility}>
          {collection.isPublic ? (
            <EyeOff className="mr-1.5 h-4 w-4" />
          ) : (
            <Eye className="mr-1.5 h-4 w-4" />
          )}
          {collection.isPublic ? t("makePrivate") : t("makePublic")}
        </Button>

        <Button variant="outline" size="sm" onClick={handleCopyLink}>
          <Link2 className="mr-1.5 h-4 w-4" />
          {t("copyLink")}
        </Button>

        <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="mr-1.5 h-4 w-4" />
          {t("delete")}
        </Button>
      </div>

      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => !open && !isDeleting && setShowDeleteDialog(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("deleteDescription", { name: collection.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              {t("deleteCancel")}
            </Button>
            <LoadingButton
              variant="destructive"
              onClick={handleDelete}
              loading={isDeleting}
              loadingText={t("deleting")}
            >
              {t("deleteConfirm")}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
