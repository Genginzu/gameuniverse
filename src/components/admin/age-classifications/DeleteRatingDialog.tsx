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
  const t = useTranslations("admin.ageClassifications.ratings.delete");
  const hasUsage = usageCount !== null && usageCount !== undefined && usageCount > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("confirm", { name: rating?.display_name ?? "" })}
          </DialogDescription>
        </DialogHeader>

        {hasUsage && (
          <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
            {t("usageWarning", { count: usageCount ?? 0 })}
          </p>
        )}

        {!hasUsage && <p className="text-destructive text-sm font-medium">{t("irreversible")}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            {t("cancel")}
          </Button>
          {!hasUsage && (
            <LoadingButton
              variant="destructive"
              onClick={onConfirm}
              loading={isDeleting}
              loadingText={t("deleting")}
            >
              {t("delete")}
            </LoadingButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
