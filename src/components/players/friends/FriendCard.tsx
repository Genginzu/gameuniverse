"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { LazyImage } from "@/components/ui/lazy-image";
import type { FriendSummary } from "@/types/friendship";

interface FriendCardProps {
  friend: FriendSummary;
  locale: string;
  onRemove?: (friendshipId: string) => Promise<void>;
}

export function FriendCard({ friend, locale: _locale, onRemove }: FriendCardProps) {
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
    <div className="border-editorial-line bg-editorial-3 group flex items-center rounded-[0.875rem] border p-3 text-white transition hover:border-[rgba(var(--accent-rgb,var(--neon-primary)),0.4)] hover:shadow-[0_8px_24px_-12px_rgba(var(--accent-rgb,var(--neon-primary)),0.25)]">
      <Link href={`/players/${friend.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        {/* Avatar */}
        <div className="bg-editorial-accent/[0.18] text-editorial-accent relative size-10 flex-shrink-0 overflow-hidden rounded-full">
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
              <Icon icon="lucide:user" className="h-5 w-5" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Name */}
        <div className="min-w-0 flex-1">
          <p className="group-hover:text-editorial-accent m-0 truncate text-sm font-semibold text-white transition-colors">
            {friend.displayName}
          </p>
        </div>

        {/* Level badge */}
        {friend.level > 0 && (
          <span className="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-[rgb(var(--accent-rgb,var(--neon-primary)))] text-[0.65rem] font-bold text-[#0a0418]">
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
          className={`ml-2 flex-shrink-0 rounded-lg transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-50 ${
            confirming
              ? "bg-red-600/90 px-3 py-1 text-[0.7rem] font-semibold text-white hover:bg-red-700"
              : "text-editorial-muted p-1.5 hover:bg-red-600/12 hover:text-red-300"
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
            <Icon icon="lucide:user-minus" className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
}
