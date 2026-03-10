"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Trash2, Loader2 } from "lucide-react";
import { FriendCard } from "@/components/players/FriendCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import type { FriendSummary } from "@/types/friendship";

interface FriendsPageFriendCardProps {
  friend: FriendSummary;
  locale: string;
  onRemove: (friendshipId: string) => Promise<void>;
}

export function FriendsPageFriendCard({ friend, locale, onRemove }: FriendsPageFriendCardProps) {
  const t = useTranslations("friends.page");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmRemove = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onRemove(friend.friendshipId);
      setIsDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }, [onRemove, friend.friendshipId]);

  return (
    <div className="relative">
      <FriendCard friend={friend} locale={locale} />

      {/* Remove button — absolute top-right */}
      <button
        type="button"
        onClick={() => setIsDialogOpen(true)}
        disabled={isDeleting}
        aria-label={t("removeFriend")}
        className="absolute right-2 top-2 z-10 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-900/20 dark:hover:text-red-400"
      >
        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>

      {/* Confirmation dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmRemoveTitle")}</DialogTitle>
            <DialogDescription>
              {t("confirmRemoveMessage", { name: friend.displayName })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                disabled={isDeleting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {t("confirmRemoveCancel")}
              </button>
            </DialogClose>
            <button
              type="button"
              onClick={handleConfirmRemove}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("confirmRemoveConfirm")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
