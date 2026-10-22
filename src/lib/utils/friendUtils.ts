import type { FriendSummary, RelationshipStatus } from "@/types/friendship";

/** État du bouton d'action ami, dérivé du statut de relation */
export type FriendButtonState =
  | "hidden"
  | "add_friend"
  | "request_sent"
  | "accept_decline"
  | "remove_friend";

/**
 * Filtre une liste d'amis par nom d'affichage (insensible à la casse).
 * Retourne tous les amis si la requête est vide.
 */
export function filterFriendsByName(friends: FriendSummary[], query: string): FriendSummary[] {
  if (!query.trim()) return friends;
  const lowerQuery = query.toLowerCase();
  return friends.filter((f) => f.displayName.toLowerCase().includes(lowerQuery));
}

/**
 * Détermine l'état du bouton d'action ami selon le statut de relation
 * et l'état d'authentification.
 */
export function getButtonState(
  status: RelationshipStatus,
  isAuthenticated: boolean
): FriendButtonState {
  if (!isAuthenticated) return "hidden";

  switch (status) {
    case "none":
      return "add_friend";
    case "pending_sent":
      return "request_sent";
    case "pending_received":
      return "accept_decline";
    case "accepted":
      return "remove_friend";
  }
}

/**
 * Génère un aria-label descriptif pour un bouton d'action ami.
 * Le label inclut toujours le nom du joueur.
 */
export function getAriaLabel(action: string, playerName: string): string {
  return `${action} ${playerName}`;
}
