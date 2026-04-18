/** Résumé d'un profil utilisé dans les listes d'abonnements */
export interface SubscriptionProfile {
  id: string;
  username: string | null;
  avatarUrl: string | null;
}

/** Une ligne de la table player_subscriptions enrichie du profil cible/abonné */
export interface SubscriptionEntry {
  id: string;
  profile: SubscriptionProfile;
  createdAt: string;
}

/** Statut de relation d'abonnement entre le spectateur et une cible */
export interface SubscriptionStatus {
  isSubscribed: boolean;
}

/** Réponse de la liste d'abonnements/abonnés */
export interface SubscriptionsListResponse {
  subscriptions: SubscriptionEntry[];
}

/** Payload POST pour créer un abonnement */
export interface CreateSubscriptionPayload {
  targetId: string;
}
