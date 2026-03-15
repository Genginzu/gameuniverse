"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, UserMinus } from "lucide-react";
import { useTranslations } from "next-intl";
import { LazyImage } from "@/components/ui/lazy-image";
import type { FriendSummary } from "@/types/friendship";

interface FriendCardProps {
  friend: FriendSummary;
  locale: string;
  onRemove?: (friendshipId: string) => Promise<void>;
}

export function FriendCard({ friend, locale, onRemove }: FriendCardProps) {
  const t = useTranslations("friends.page");
  const [confirming, setConfirming] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Fermer la confirmation si on clique ailleurs
  useEffect(() => {
    if (!confirming) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (confirmRef.current && !confirmRef.current.contains(e.target as Node)) {
        setConfirming(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [confirming]);

  const handleClick = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setIsRemoving(true);
    try {
      await onRemove?.(friend.friendshipId);
    } finally {
      setIsRemoving(false);
      setConfirming(false);
    }
  };

  return (
    <div className="group flex items-center rounded-xl border border-gray-200 bg-white p-3 transition-all hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:bg-slate-800">
      <Link
        href={`/${locale}/players/${friend.id}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        {/* Avatar */}
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
          {friend.avatarUrl ? (
            <LazyImage
              src={friend.avatarUrl}
              alt={friend.displayName}
              fill
              className="object-cover"
              sizes="40px"
              showSkeleton
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-5 w-5 text-blue-300" />
            </div>
          )}
        </div>

        {/* Name */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
            {friend.displayName}
          </p>
        </div>

        {/* Level badge */}
        {friend.level > 0 && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
            {friend.level}
          </span>
        )}
      </Link>

      {/* Remove: icon → inline confirm button */}
      {onRemove && (
        <button
          ref={confirmRef}
          type="button"
          onClick={handleClick}
          disabled={isRemoving}
          className={`ml-2 shrink-0 rounded-lg transition-all duration-200 disabled:opacity-50 ${
            confirming
              ? "bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
              : "p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:text-slate-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          }`}
          aria-label={confirming ? t("confirmRemoveConfirm") : t("removeFriend")}
        >
          {confirming ? (
            isRemoving ? (
              "…"
            ) : (
              t("confirmRemoveConfirm")
            )
          ) : (
            <UserMinus className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}
