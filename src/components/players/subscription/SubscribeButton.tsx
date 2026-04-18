"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { useSubscriptionRelationship } from "@/hooks/useSubscriptionRelationship";

interface SubscribeButtonProps {
  targetId: string;
  isAuthenticated: boolean;
  isOwner: boolean;
}

/**
 * Bouton S'abonner / Se désabonner affiché sur le profil d'un autre joueur.
 * - Caché si l'utilisateur est le propriétaire du profil ou n'est pas connecté.
 * - Optimistic update géré par `useSubscriptionRelationship`.
 */
export function SubscribeButton({ targetId, isAuthenticated, isOwner }: SubscribeButtonProps) {
  const t = useTranslations("subscriptions");
  const { isSubscribed, isLoading, subscribe, unsubscribe } = useSubscriptionRelationship(targetId);
  const [isProcessing, setIsProcessing] = useState(false);

  if (isOwner || !isAuthenticated) return null;

  const handleAction = async (action: () => Promise<void>) => {
    setIsProcessing(true);
    try {
      await action();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!window.confirm(t("confirmUnsubscribe"))) return;
    await handleAction(unsubscribe);
  };

  const busy = isProcessing || isLoading;

  return (
    <div aria-live="polite">
      {!isSubscribed && (
        <Button size="sm" onClick={() => handleAction(subscribe)} disabled={busy}>
          {busy ? (
            <Icon icon="lucide:loader-2" className="animate-spin" />
          ) : (
            <Icon icon="lucide:rss" />
          )}
          {t("subscribe")}
        </Button>
      )}

      {isSubscribed && (
        <Button size="sm" variant="outline" onClick={handleUnsubscribe} disabled={busy}>
          {busy ? (
            <Icon icon="lucide:loader-2" className="animate-spin" />
          ) : (
            <Icon icon="lucide:bell-off" />
          )}
          {t("unsubscribe")}
        </Button>
      )}
    </div>
  );
}
