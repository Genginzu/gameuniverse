import type { ConversationSummary } from "@/types/discussion";

/**
 * Tronque un contenu à maxLength caractères avec ellipsis ("…") si nécessaire.
 */
export function truncatePreview(content: string, maxLength: number = 80): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + "…";
}

/**
 * Trie les conversations par date du dernier message (plus récent en premier).
 * Les conversations sans dernier message sont placées à la fin.
 */
export function sortConversationsByRecent(
  conversations: ConversationSummary[]
): ConversationSummary[] {
  return [...conversations].sort((a, b) => {
    if (!a.lastMessage && !b.lastMessage) return 0;
    if (!a.lastMessage) return 1;
    if (!b.lastMessage) return -1;
    return (
      new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );
  });
}

/**
 * Formate une date en chaîne relative :
 * - < 1 min : "À l'instant"
 * - < 60 min : "il y a X min"
 * - < 24h : "il y a X h"
 * - sinon : format DD/MM/YYYY
 */
export function formatMessageDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `il y a ${diffHours} h`;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Retourne les deux UUIDs dans l'ordre canonique [min, max].
 * Utilisé pour la contrainte participant_1 < participant_2.
 */
export function canonicalParticipants(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}
