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
    <div className="editorial-friend-card group">
      <Link href={`/players/${friend.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        {/* Avatar */}
        <div className="editorial-friend-card-avatar">
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
          <p className="editorial-friend-card-name">{friend.displayName}</p>
        </div>

        {/* Level badge */}
        {friend.level > 0 && (
          <span className="editorial-friend-card-level">{friend.level}</span>
        )}
      </Link>

      {/* Remove: icon → inline confirm button */}
      {onRemove && (
        <button
          ref={confirmRef}
          type="button"
          onClick={handleClick}
          disabled={isRemoving}
          className={`editorial-friend-card-remove${confirming ? " confirming" : ""}`}
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
