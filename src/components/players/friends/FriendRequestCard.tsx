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
    <div className="border-editorial-line bg-editorial-3 flex items-center gap-3 rounded-[0.875rem] border p-3 text-white">
      {/* Sender avatar */}
      <div className="bg-editorial-accent/[0.18] text-editorial-accent relative size-10 flex-shrink-0 overflow-hidden rounded-full">
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
        <p className="m-0 truncate text-sm font-semibold text-white">{sender.displayName}</p>
        <p className="text-editorial-muted m-0 mt-0.5 font-mono text-[0.7rem]">
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
