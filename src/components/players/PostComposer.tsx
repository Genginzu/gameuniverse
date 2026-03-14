"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Send, Loader2, Image, User } from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";
import { useToast } from "@/hooks/use-toast";
import { isValidImageUrl } from "@/lib/utils/postContentParser";
import { useMentionAutocomplete } from "@/hooks/useMentionAutocomplete";
import { MentionSuggestions } from "./MentionSuggestions";
import { TagInput } from "./TagInput";
import type { Post } from "@/types/post";

const MAX_LENGTH = 2000;

interface PostComposerProps {
  onPostCreated: (post: Post) => void;
  playerId: string;
  playerAvatar: string | null;
  isCreating: boolean;
  onSubmit: (content: string, imageUrl?: string) => Promise<void>;
}

export function PostComposer({
  onPostCreated: _onPostCreated,
  playerAvatar,
  isCreating,
  onSubmit,
}: PostComposerProps) {
  const t = useTranslations("players.posts");
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { suggestions, isLoading, isOpen, mentionQuery } = useMentionAutocomplete(
    content,
    cursorPos
  );

  const trimmed = content.trim();
  const hasImageUrlError = imageUrl.trim() !== "" && !isValidImageUrl(imageUrl.trim());
  const isDisabled = !trimmed || isCreating || hasImageUrlError;
  const remaining = MAX_LENGTH - content.length;

  const handleSelectMention = useCallback(
    (username: string) => {
      if (!mentionQuery) return;
      const before = content.slice(0, cursorPos - mentionQuery.length);
      const after = content.slice(cursorPos);
      const newContent = `${before}${username} ${after}`;
      setContent(newContent);
      setSelectedIndex(0);
      // Restore focus and cursor after React re-render
      const newCursorPos = before.length + username.length + 1;
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
        setCursorPos(newCursorPos);
      }, 0);
    },
    [content, cursorPos, mentionQuery]
  );

  const handleSubmit = async () => {
    if (isDisabled) return;
    try {
      const validUrl =
        imageUrl.trim() && isValidImageUrl(imageUrl.trim()) ? imageUrl.trim() : undefined;
      // Append explicit tags so server-side extractTags() picks them up
      const tagsSuffix = tags.length > 0 ? ` ${tags.map((t) => `#${t}`).join(" ")}` : "";
      await onSubmit(content + tagsSuffix, validUrl);
      setContent("");
      setImageUrl("");
      setTags([]);
    } catch {
      toast({ variant: "destructive", title: t("errorCreate") });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Mention navigation
    if (isOpen && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleSelectMention(suggestions[selectedIndex].username);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setCursorPos(0); // Reset to close suggestions
        return;
      }
    }

    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !isDisabled) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setCursorPos(e.target.selectionStart ?? 0);
    setSelectedIndex(0);
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setCursorPos((e.target as HTMLTextAreaElement).selectionStart ?? 0);
  };

  return (
    <div className="rounded-2xl bg-white/80 p-4 shadow-md backdrop-blur-xl transition-all duration-300 dark:bg-slate-800/60 dark:shadow-lg dark:shadow-black/20">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
          {playerAvatar ? (
            <LazyImage
              src={playerAvatar}
              alt=""
              fill
              className="object-cover"
              sizes="40px"
              showSkeleton
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-5 w-5 text-blue-300" />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="min-w-0 flex-1">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleChange}
              onSelect={handleSelect}
              onKeyDown={handleKeyDown}
              placeholder={t("placeholder")}
              aria-label={t("placeholder")}
              maxLength={MAX_LENGTH}
              rows={3}
              className="w-full resize-none rounded-xl border-2 border-violet-300 bg-white/60 p-3 pb-7 text-sm text-gray-800 placeholder-gray-400 backdrop-blur-sm transition-all duration-200 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 dark:border-violet-500/50 dark:bg-slate-700/40 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-violet-400/60 dark:focus:ring-violet-400/15"
            />
            <span
              className={`absolute bottom-2 right-3 text-xs ${remaining < 0 ? "text-red-500" : "text-gray-400 dark:text-slate-500"}`}
            >
              {t("charCount", { remaining })}
            </span>

            {/* Mention autocomplete dropdown */}
            <MentionSuggestions
              suggestions={suggestions}
              isLoading={isLoading}
              isOpen={isOpen}
              selectedIndex={selectedIndex}
              onSelect={handleSelectMention}
            />
          </div>

          {/* Tag input */}
          <div className="mt-2">
            <TagInput tags={tags} onChange={setTags} />
          </div>

          {/* Actions bar: image URL + publish */}
          <div className="mt-3 flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Image className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-400 dark:text-violet-300" />
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder={t("imageUrlPlaceholder")}
                aria-label={t("imageUrlAriaLabel")}
                className="w-full rounded-full border-2 border-violet-300 bg-white/60 py-2 pl-9 pr-3 text-xs text-gray-800 placeholder-gray-400 transition-all duration-200 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 dark:border-violet-500/50 dark:bg-slate-700/40 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-violet-400/60 dark:focus:ring-violet-400/15"
              />
              {hasImageUrlError && (
                <p className="absolute -bottom-4 left-3 text-[10px] text-red-500">
                  {t("imageUrlError")}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isDisabled}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition-all duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {t("publish")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
