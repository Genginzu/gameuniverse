"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/ui/lazy-image";
import { getAriaLabel } from "@/lib/utils/friendUtils";
import type { FriendRequest } from "@/types/friendship";

interface FriendRequestCardProps {
  request: FriendRequest;
  onAccept: (friendshipId: string) => void;
  onDecline: (friendshipId: string) => void;
  isProcessing: boolean;
}

export function FriendRequestCard({
  request,
  onAccept,
  onDecline,
  isProcessing,
}: FriendRequestCardProps) {
  const t = useTranslations("friends");
  const { sender } = request;

  return (
    <div className="editorial-friend-request">
      {/* Sender avatar */}
      <div className="editorial-friend-card-avatar">
        {sender.avatarUrl ? (
          <LazyImage
            src={sender.avatarUrl}
            alt={sender.displayName}
            fill
            className="object-cover"
            sizes="40px"
            showSkeleton
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon icon="lucide:user" className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Sender name + date */}
      <div className="min-w-0 flex-1">
        <p className="editorial-friend-request-name">{sender.displayName}</p>
        <p className="editorial-friend-request-date">
          {new Date(request.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Accept / Decline buttons */}
      <div className="flex shrink-0 gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={() => onAccept(request.friendshipId)}
          disabled={isProcessing}
          aria-label={getAriaLabel(t("accept"), sender.displayName)}
        >
          {isProcessing ? (
            <Icon icon="lucide:loader-2" className="animate-spin" />
          ) : (
            <Icon icon="lucide:check" />
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDecline(request.friendshipId)}
          disabled={isProcessing}
          aria-label={getAriaLabel(t("decline"), sender.displayName)}
        >
          {isProcessing ? (
            <Icon icon="lucide:loader-2" className="animate-spin" />
          ) : (
            <Icon icon="lucide:x" />
          )}
        </Button>
      </div>
    </div>
  );
}
