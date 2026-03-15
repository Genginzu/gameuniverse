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
import type { AdminAchievement } from "@/types/admin-achievements";

export interface DeleteAchievementDialogProps {
  achievement: AdminAchievement | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  usageCount?: number;
}

export function DeleteAchievementDialog({
  achievement,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  usageCount,
}: DeleteAchievementDialogProps) {
  const t = useTranslations("adminAchievements.deleteDialog");
  const hasUsage = usageCount !== null && usageCount !== undefined && usageCount > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("warning", { name: achievement?.key ?? "" })}</DialogDescription>
        </DialogHeader>

        {hasUsage && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
              {t("usageWarning", { count: usageCount })}
            </p>
            <p className="text-sm text-orange-600 dark:text-orange-400">{t("forceWarning")}</p>
          </div>
        )}

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
            {hasUsage ? t("forceConfirm") : t("confirm")}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
