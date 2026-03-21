"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { FriendRequestCard } from "./FriendRequestCard";
import type { FriendRequest } from "@/types/friendship";

interface FriendRequestListProps {
  requests: FriendRequest[];
  onAccept: (friendshipId: string) => Promise<void>;
  onDecline: (friendshipId: string) => Promise<void>;
}

export function FriendRequestList({ requests, onAccept, onDecline }: FriendRequestListProps) {
  const t = useTranslations("friends");
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const handleAccept = useCallback(
    async (friendshipId: string) => {
      setProcessingIds((prev) => new Set(prev).add(friendshipId));
      try {
        await onAccept(friendshipId);
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(friendshipId);
          return next;
        });
      }
    },
    [onAccept]
  );

  const handleDecline = useCallback(
    async (friendshipId: string) => {
      setProcessingIds((prev) => new Set(prev).add(friendshipId));
      try {
        await onDecline(friendshipId);
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(friendshipId);
          return next;
        });
      }
    },
    [onDecline]
  );

  if (requests.length === 0) return null;

  const isProcessing = processingIds.size > 0;

  return (
    <section aria-busy={isProcessing} className="mb-6">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-slate-300">
        {t("pendingRequests")}
      </h3>
      <div className="space-y-2">
        {requests.map((request) => (
          <FriendRequestCard
            key={request.friendshipId}
            request={request}
            onAccept={handleAccept}
            onDecline={handleDecline}
            isProcessing={processingIds.has(request.friendshipId)}
          />
        ))}
      </div>
    </section>
  );
}
