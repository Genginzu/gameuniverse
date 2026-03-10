import type { FriendSummary, RelationshipStatus } from "@/types/friendship";

/** État du bouton d'action ami, dérivé du statut de relation */
export type FriendButtonState =
  | "hidden"
  | "add_friend"
  | "request_sent"
  | "accept_decline"
  | "remove_friend";

/**
 * Calcule les informations de pagination à partir du total, de la page courante et de la limite.
 */
export function computePagination(
  totalCount: number,
  page: number,
  limit: number
): { currentPage: number; totalPages: number; hasNextPage: boolean } {
  const totalPages = totalCount === 0 ? 1 : Math.ceil(totalCount / limit);
  return {
    currentPage: page,
    totalPages,
    hasNextPage: page < totalPages,
  };
}

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

/**
 * Compte le nombre d'amitiés acceptées dans une liste.
 */
export function countAcceptedFriends(friendships: Array<{ status: string }>): number {
  return friendships.filter((f) => f.status === "accepted").length;
}

/**
 * Trie une liste d'amis par date d'acceptation décroissante (plus récent en premier).
 * Retourne un nouveau tableau sans muter l'original.
 */
export function sortFriendsByDate(friends: FriendSummary[]): FriendSummary[] {
  return [...friends].sort(
    (a, b) => new Date(b.acceptedAt).getTime() - new Date(a.acceptedAt).getTime()
  );
}

/**
 * Compte le nombre de demandes d'amitié en attente reçues par un utilisateur.
 * Ne compte que les entrées où receiver_id === userId et status === 'pending'.
 */
export function countPendingRequests(
  friendships: Array<{ receiver_id: string; status: string }>,
  userId: string
): number {
  return friendships.filter((f) => f.receiver_id === userId && f.status === "pending").length;
}
