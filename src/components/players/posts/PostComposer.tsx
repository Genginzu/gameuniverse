"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { LazyImage } from "@/components/ui/lazy-image";
import { useToast } from "@/hooks/use-toast";
import { usePostImageUpload } from "@/hooks/usePostImageUpload";
import { useMentionAutocomplete } from "@/hooks/useMentionAutocomplete";
import { MentionSuggestions } from "./MentionSuggestions";
import { TagInput } from "./TagInput";
import { PostComposerActions } from "./PostComposerActions";
import { PostImagePreview } from "./PostImagePreview";
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
  const { suggestions, isLoading, isOpen, mentionQuery } = useMentionAutocomplete(content, cursorPos);

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
    if (isOpen && suggestions.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => (i + 1) % suggestions.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => (i - 1 + suggestions.length) % suggestions.length); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); handleSelectMention(suggestions[selectedIndex].username); return; }
      if (e.key === "Escape") { e.preventDefault(); setCursorPos(0); return; }
    }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !isDisabled) { e.preventDefault(); handleSubmit(); }
  };

  return (
    <div className="rounded-2xl bg-white/80 p-4 shadow-md backdrop-blur-xl transition-all duration-300 dark:bg-slate-800/60 dark:shadow-lg dark:shadow-black/20">
      <div className="flex gap-3">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
          {playerAvatar ? (
            <LazyImage src={playerAvatar} alt="" fill className="object-cover" sizes="40px" showSkeleton />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Icon icon="lucide:user" className="h-5 w-5 text-blue-300" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => { setContent(e.target.value); setCursorPos(e.target.selectionStart ?? 0); setSelectedIndex(0); }}
              onSelect={(e) => setCursorPos((e.target as HTMLTextAreaElement).selectionStart ?? 0)}
              onKeyDown={handleKeyDown}
              placeholder={t("placeholder")}
              aria-label={t("placeholder")}
              maxLength={MAX_LENGTH}
              rows={3}
              className="w-full resize-none rounded-xl border-2 border-violet-300 bg-white/60 p-3 pb-7 text-sm text-gray-800 placeholder-gray-400 backdrop-blur-xs transition-all duration-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 focus:outline-hidden dark:border-violet-500/50 dark:bg-slate-700/40 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-violet-400/60 dark:focus:ring-violet-400/15"
            />
            <span className={`absolute right-3 bottom-2 text-xs ${remaining < 0 ? "text-red-500" : "text-gray-400 dark:text-slate-500"}`}>
              {t("charCount", { remaining })}
            </span>
            <MentionSuggestions suggestions={suggestions} isLoading={isLoading} isOpen={isOpen} selectedIndex={selectedIndex} onSelect={handleSelectMention} />
          </div>

          <div className="mt-2">
            <TagInput tags={tags} onChange={setTags} />
          </div>

          <PostImagePreview
            previewUrl={imageUpload.previewUrl ?? ""}
            uploading={imageUpload.uploading}
            progress={imageUpload.progress}
            error={imageUpload.error}
            onClear={imageUpload.clearImage}
            removeLabel={t("imageRemove")}
            errorPrefix={t("imageError_")}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) imageUpload.handleFileSelect(file); e.target.value = ""; }}
          />

          <PostComposerActions
            onImageClick={() => fileInputRef.current?.click()}
            onSubmit={handleSubmit}
            isDisabled={isDisabled}
            isCreating={isCreating}
            isUploading={imageUpload.uploading}
          />
        </div>
      </div>
    </div>
  );
}
