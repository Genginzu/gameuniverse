/**
 * Pure utility functions for parsing post content.
 * Extracts tags (#hashtags), mentions (@pseudo), and validates image URLs.
 */

const TAG_REGEX = /#([a-zA-Z0-9_-]+)/g;
const MENTION_REGEX = /@([a-zA-Z0-9_-]+)/g;
const MAX_ITEMS = 10;

/**
 * Extrait les tags (#mot) du contenu.
 * Retourne max 10 tags normalisés en minuscules, sans doublons.
 */
export function extractTags(content: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const match of content.matchAll(TAG_REGEX)) {
    const tag = match[1].toLowerCase();
    if (!seen.has(tag)) {
      seen.add(tag);
      tags.push(tag);
      if (tags.length >= MAX_ITEMS) break;
    }
  }

  return tags;
}

/**
 * Extrait les mentions (@pseudo) du contenu.
 * Retourne max 10 pseudos uniques (sans le `@`).
 */
export function extractMentions(content: string): string[] {
  const seen = new Set<string>();
  const mentions: string[] = [];

  for (const match of content.matchAll(MENTION_REGEX)) {
    const mention = match[1];
    if (!seen.has(mention)) {
      seen.add(mention);
      mentions.push(mention);
      if (mentions.length >= MAX_ITEMS) break;
    }
  }

  return mentions;
}

/**
 * Valide qu'une URL est un lien https:// syntaxiquement valide.
 */
export function isValidImageUrl(url: string): boolean {
  if (!url.startsWith("https://")) return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
