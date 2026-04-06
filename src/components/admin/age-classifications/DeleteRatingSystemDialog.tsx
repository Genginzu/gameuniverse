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
  const t = useTranslations("admin.ageClassifications.deleteSystem");
  const hasUsage = usageCount !== null && usageCount !== undefined && usageCount > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("confirm", { name: system?.name ?? "" })}</DialogDescription>
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
