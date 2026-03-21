"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { PostMention } from "@/types/post";

interface PostContentRendererProps {
  content: string;
  tags: string[];
  mentions: PostMention[];
  locale: string;
}

/** Regex matching #tag or @mention tokens in post content. */
const TOKEN_REGEX = /(#[a-zA-Z0-9_-]+|@[a-zA-Z0-9_-]+)/g;

/**
 * Splits content into plain-text and token segments, preserving order.
 * Each segment is either a plain string or a token starting with # or @.
 */
function tokenize(content: string): string[] {
  const parts: string[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(TOKEN_REGEX)) {
    const matchIndex = match.index ?? 0;
    // Push preceding plain text
    if (matchIndex > lastIndex) {
      parts.push(content.slice(lastIndex, matchIndex));
    }
    parts.push(match[0]);
    lastIndex = matchIndex + match[0].length;
  }

  // Push trailing plain text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
}

export function PostContentRenderer({ content, tags, mentions, locale }: PostContentRendererProps) {
  const t = useTranslations("players.posts");

  // Build a Set of valid tags (lowercase) for O(1) lookup
  const validTags = new Set(tags.map((tag) => tag.toLowerCase()));

  // Build a Map of username → playerId for O(1) mention lookup
  const mentionMap = new Map<string, string>();
  for (const m of mentions) {
    mentionMap.set(m.username.toLowerCase(), m.playerId);
  }

  const segments = tokenize(content);

  return (
    <span className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-slate-200">
      {segments.map((segment, index) => {
        // Tag token — skip rendering (tags are displayed as pills below content)
        if (segment.startsWith("#")) {
          const tagName = segment.slice(1).toLowerCase();
          if (validTags.has(tagName)) {
            return null;
          }
        }

        // Mention token
        if (segment.startsWith("@")) {
          const username = segment.slice(1);
          const playerId = mentionMap.get(username.toLowerCase());
          if (playerId) {
            return (
              <Link
                key={index}
                href={`/${locale}/players/${playerId}`}
                aria-label={t("mentionAriaLabel", { username })}
                className="text-cyan-500 transition-all duration-300 hover:underline dark:text-cyan-300"
              >
                @{username}
              </Link>
            );
          }
        }

        // Plain text (or unmatched token)
        return <span key={index}>{segment}</span>;
      })}
    </span>
  );
}
