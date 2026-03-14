import { useState, useEffect, useCallback, useRef } from "react";

export interface MentionSuggestion {
  id: string;
  username: string;
  avatarUrl: string | null;
}

/**
 * Detects @mention patterns in textarea content and fetches matching players.
 * Returns suggestions and the current mention query for positioning.
 */
export function useMentionAutocomplete(content: string, cursorPosition: number) {
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Extract the @mention query at cursor position
  const extractMentionQuery = useCallback((): string | null => {
    const textBeforeCursor = content.slice(0, cursorPosition);
    // Match @ followed by word chars at the end of text before cursor
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_-]{1,})$/);
    return match ? match[1] : null;
  }, [content, cursorPosition]);

  useEffect(() => {
    const query = extractMentionQuery();
    setMentionQuery(query);

    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    // Debounce API calls by 250ms
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      try {
        const res = await fetch(`/api/players/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          setSuggestions([]);
          return;
        }
        const data = await res.json();
        setSuggestions(data.players ?? []);
      } catch {
        if (!controller.signal.aborted) setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, [extractMentionQuery]);

  const isOpen = mentionQuery !== null && mentionQuery.length >= 2;

  return { suggestions, isLoading, isOpen, mentionQuery };
}
