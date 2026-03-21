"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { getButtonState } from "@/lib/utils/friendUtils";
import type { RelationshipStatus } from "@/types/friendship";

interface FriendActionButtonProps {
  playerId: string;
  isAuthenticated: boolean;
  isOwner: boolean;
  relationshipStatus: RelationshipStatus;
  friendshipId: string | null;
  sendRequest: () => Promise<void>;
  acceptRequest: (friendshipId: string) => Promise<void>;
  declineRequest: (friendshipId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
}

export function FriendActionButton({
  playerId: _playerId,
  isAuthenticated,
  isOwner,
  relationshipStatus,
  friendshipId,
  sendRequest,
  acceptRequest,
  declineRequest,
  removeFriend,
}: FriendActionButtonProps) {
  const t = useTranslations("friends");
  const [isProcessing, setIsProcessing] = useState(false);

  if (isOwner) return null;

  const buttonState = getButtonState(relationshipStatus, isAuthenticated);
  if (buttonState === "hidden") return null;

  const handleAction = async (action: () => Promise<void>) => {
    setIsProcessing(true);
    try {
      await action();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!window.confirm(t("confirmRemove"))) return;
    if (!friendshipId) return;
    await handleAction(() => removeFriend(friendshipId));
  };

  return (
    <div aria-live="polite">
      {buttonState === "add_friend" && (
        <Button size="sm" onClick={() => handleAction(sendRequest)} disabled={isProcessing}>
          {isProcessing ? (
            <Icon icon="lucide:loader-2" className="animate-spin" />
          ) : (
            <Icon icon="lucide:user-plus" />
          )}
          {t("addFriend")}
        </Button>
      )}

      {buttonState === "request_sent" && (
        <Button size="sm" variant="secondary" disabled>
          {t("requestSent")}
        </Button>
      )}

      {buttonState === "accept_decline" && friendshipId && (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => handleAction(() => acceptRequest(friendshipId))}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Icon icon="lucide:loader-2" className="animate-spin" />
            ) : (
              <Icon icon="lucide:check" />
            )}
            {t("accept")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction(() => declineRequest(friendshipId))}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Icon icon="lucide:loader-2" className="animate-spin" />
            ) : (
              <Icon icon="lucide:x" />
            )}
            {t("decline")}
          </Button>
        </div>
      )}

      {buttonState === "remove_friend" && (
        <Button size="sm" variant="outline" onClick={handleRemoveFriend} disabled={isProcessing}>
          {isProcessing ? (
            <Icon icon="lucide:loader-2" className="animate-spin" />
          ) : (
            <Icon icon="lucide:user-minus" />
          )}
          {t("removeFriend")}
        </Button>
      )}
    </div>
  );
}
