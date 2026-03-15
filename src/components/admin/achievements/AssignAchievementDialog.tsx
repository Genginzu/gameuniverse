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

export interface AssignAchievementDialogProps {
  achievement: AdminAchievement | null;
  playerName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isAssigning: boolean;
}

export function AssignAchievementDialog({
  achievement,
  playerName,
  isOpen,
  onClose,
  onConfirm,
  isAssigning,
}: AssignAchievementDialogProps) {
  const t = useTranslations("adminAchievements.playerManager.assignDialog");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isAssigning && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("message", {
              achievement: achievement?.key ?? "",
              player: playerName,
            })}
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {t("xpInfo", { xp: achievement?.xpValue ?? 0 })}
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isAssigning}>
            {t("cancel")}
          </Button>
          <LoadingButton onClick={onConfirm} loading={isAssigning} loadingText={t("assigning")}>
            {t("confirm")}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
