"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Send, Loader2, Image as ImageIcon, User, X } from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";
import { useToast } from "@/hooks/use-toast";
import { usePostImageUpload } from "@/hooks/usePostImageUpload";
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
  onSubmit: (content: string, imageUrl?: string, tags?: string[]) => Promise<void>;
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
  const [tags, setTags] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageUpload = usePostImageUpload();

  const { suggestions, isLoading, isOpen, mentionQuery } = useMentionAutocomplete(
    content,
    cursorPos
  );

  const trimmed = content.trim();
  const isDisabled = !trimmed || isCreating || imageUpload.uploading;
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
      await onSubmit(content, imageUpload.uploadedUrl ?? undefined, tags);
      setContent("");
      setTags([]);
      imageUpload.clearImage();
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
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
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
              className="w-full resize-none rounded-xl border-2 border-violet-300 bg-white/60 p-3 pb-7 text-sm text-gray-800 placeholder-gray-400 backdrop-blur-xs transition-all duration-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 focus:outline-hidden dark:border-violet-500/50 dark:bg-slate-700/40 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-violet-400/60 dark:focus:ring-violet-400/15"
            />
            <span
              className={`absolute right-3 bottom-2 text-xs ${remaining < 0 ? "text-red-500" : "text-gray-400 dark:text-slate-500"}`}
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

          {/* Image preview */}
          {imageUpload.previewUrl && (
            <div className="relative mt-2 overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUpload.previewUrl}
                alt=""
                className="max-h-48 w-full rounded-xl object-cover"
              />
              {imageUpload.uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                  <div className="flex items-center gap-2 text-sm text-white">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {imageUpload.progress}%
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={imageUpload.clearImage}
                className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-black/70"
                aria-label={t("imageRemove")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {imageUpload.error && (
            <p className="mt-1 text-xs text-red-500">{t(`imageError_${imageUpload.error}`)}</p>
          )}

          {/* Actions bar: file picker + publish */}
          <div className="mt-3 flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) imageUpload.handleFileSelect(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUpload.uploading}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-violet-300 bg-white/60 px-3 py-2 text-xs text-violet-500 transition-all duration-200 hover:bg-violet-50 disabled:opacity-50 dark:border-violet-500/50 dark:bg-slate-700/40 dark:text-violet-300 dark:hover:bg-slate-700/60"
              aria-label={t("imageUploadLabel")}
            >
              <ImageIcon className="h-4 w-4" />
              {t("imageUploadButton")}
            </button>

            <div className="flex-1" />

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isDisabled}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-linear-to-br from-violet-500 to-blue-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition-all duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
