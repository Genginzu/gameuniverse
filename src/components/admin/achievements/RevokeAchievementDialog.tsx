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

export interface RevokeAchievementDialogProps {
  achievement: AdminAchievement | null;
  playerName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isRevoking: boolean;
}

export function RevokeAchievementDialog({
  achievement,
  playerName,
  isOpen,
  onClose,
  onConfirm,
  isRevoking,
}: RevokeAchievementDialogProps) {
  const t = useTranslations("adminAchievements.playerManager.revokeDialog");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isRevoking && onClose()}>
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

        <p className="text-sm font-medium text-destructive">
          {t("xpInfo", { xp: achievement?.xpValue ?? 0 })}
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isRevoking}>
            {t("cancel")}
          </Button>
          <LoadingButton
            variant="destructive"
            onClick={onConfirm}
            loading={isRevoking}
            loadingText={t("revoking")}
          >
            {t("confirm")}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
